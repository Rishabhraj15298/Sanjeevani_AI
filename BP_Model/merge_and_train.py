import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from fuzzywuzzy import process
from difflib import get_close_matches
import warnings, os

warnings.filterwarnings("ignore")

# ==============================================================
# GLOBAL VARIABLES
# ==============================================================
models = {}
le = None
riders = None
brands = None


# ==============================================================
# FLEXIBLE EXCEL READER
# ==============================================================
def read_excel_auto(file_path, sheet_name=None):
    ext = os.path.splitext(file_path)[-1].lower()
    if ext == ".xlsb":
        return pd.read_excel(file_path, sheet_name=sheet_name, engine="pyxlsb")
    elif ext == ".xlsx":
        return pd.read_excel(file_path, sheet_name=sheet_name, engine="openpyxl")
    elif ext == ".xls":
        return pd.read_excel(file_path, sheet_name=sheet_name, engine="xlrd")
    else:
        raise ValueError(f"Unsupported file type: {ext}")


# ==============================================================
# INITIALIZE MODEL (LOAD + CLEAN + TRAIN)
# ==============================================================
def initialize_model():
    global brands, riders, models, le

    print("🔹 Initializing model for FastAPI use...")

    # ---- Load Excel Files ----
    riders_file = "Riders HTN 20 Feb 2025 New.xlsx"
    brands_file = "Classified Antihypertensive - Brand Names.xlsb"

    # Load Riders
    riders = read_excel_auto(riders_file, sheet_name="Riders 12 March 2025")

    # Load Brands
    xlsb = pd.ExcelFile(brands_file, engine="pyxlsb")
    target_sheet = get_close_matches("Main Drug List", xlsb.sheet_names, n=1, cutoff=0.5)
    sheet_to_use = target_sheet[0] if target_sheet else xlsb.sheet_names[0]
    brands = read_excel_auto(brands_file, sheet_name=sheet_to_use)

    print("🔹 Cleaning Riders and Brand data...")
    riders.columns = [c.strip().replace("\n", " ").replace("  ", " ") for c in riders.columns]
    brands.columns = [c.strip().upper() for c in brands.columns]

    # ---- Dynamic Column Mapping for Riders ----
    col_map = {}
    for col in riders.columns:
        name = col.lower()
        if "htn" in name and "gr" in name:
            col_map["HTN_Gr"] = col
        elif "action" in name:
            col_map["Action"] = col
        elif "final" in name:
            col_map["Final_Group"] = col
        elif "output" in name:
            col_map["Output"] = col
        elif "adverse" in name or "correction" in name:
            col_map["Note"] = col

    riders = riders[[col_map[k] for k in col_map.keys() if k in col_map]]
    riders.columns = list(col_map.keys())

    # Drop empty data
    riders.dropna(subset=["HTN_Gr", "Output"], inplace=True)

    # ---- Clean text values ----
    riders["HTN_Gr"] = riders["HTN_Gr"].astype(str).str.upper().str.replace(" ", "")

    # ---- Clean Brands ----
    if "MOLECULE_DESC" not in brands.columns or "BRANDS" not in brands.columns:
        raise ValueError("❌ 'MOLECULE_DESC' or 'BRANDS' column missing in brand data")

    brands.dropna(subset=["MOLECULE_DESC", "BRANDS"], inplace=True)

    # ---- Fuzzy Match Brands to Riders Output ----
    print("🔹 Mapping brands to Riders output...")
    def get_brand(molecule):
        if not isinstance(molecule, str) or molecule.strip() == "":
            return None
        match = process.extractOne(molecule.lower(), brands["MOLECULE_DESC"].str.lower().tolist())
        if match and match[1] > 80:
            row = brands.loc[brands["MOLECULE_DESC"].str.lower() == match[0]]
            return ", ".join(row["BRANDS"].dropna().tolist())
        return None

    riders["Brand_Names"] = riders["Output"].apply(get_brand)

    # ==============================================================
    # TRAINING THE REAL ML MODEL
    # ==============================================================
    print("🔹 Creating realistic training dataset for ML...")

    bp_data = []
    np.random.seed(42)
    ranges = {
        "GRI": {"sys": (110, 139), "dia": (70, 89)},
        "GRII": {"sys": (140, 159), "dia": (90, 99)},
        "GRIII": {"sys": (160, 200), "dia": (100, 120)},
    }

    for group, vals in ranges.items():
        for _ in range(300):
            systolic = np.random.randint(*vals["sys"])
            diastolic = np.random.randint(*vals["dia"])
            bp_data.append([systolic, diastolic, group])

    bp_df = pd.DataFrame(bp_data, columns=["Systolic", "Diastolic", "HTN_Gr"])

    X = bp_df[["Systolic", "Diastolic"]]
    le = LabelEncoder()
    y = le.fit_transform(bp_df["HTN_Gr"])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf = RandomForestClassifier(n_estimators=100, random_state=0)
    rf.fit(X_train, y_train)
    acc = rf.score(X_test, y_test)
    print(f"✅ RandomForest accuracy: {acc:.2f}")

    models["RandomForest"] = rf

    print("🚀 Model initialized and ready for inference.")


# ==============================================================
# ML-BASED RECOMMENDATION FUNCTION
# ==============================================================
def adaptive_recommendation(bp_sys, bp_dia, current_med, response):
    global riders, brands, models, le

    if models.get("RandomForest") is None:
        raise RuntimeError("Model not initialized")

    rf = models["RandomForest"]

    # Predict HTN group using ML
    probs = rf.predict_proba([[bp_sys, bp_dia]])[0]
    confidence = float(np.max(probs))
    pred_idx = np.argmax(probs)
    current_group = le.inverse_transform([pred_idx])[0]

    # Handle low-confidence fallback
    if confidence < 0.6:
        print("⚠️ Low confidence fallback triggered")
        if bp_sys >= 160 or bp_dia >= 100:
            current_group = "GRIII"
        elif bp_sys >= 140 or bp_dia >= 90:
            current_group = "GRII"
        else:
            current_group = "GRI"

    # Determine escalation based on response
    if response.lower() == "still high":
        if current_group == "GRI":
            new_group = "GRII"
            action = "Add ARB or ACEI"
        elif current_group == "GRII":
            new_group = "GRIII"
            action = "Add Diuretic or increase dose"
        else:
            new_group = "GRIII"
            action = "Add BB or optimize triple therapy"
    elif response.lower() == "normal":
        new_group = current_group
        action = "Maintain same therapy"
    elif response.lower() == "low":
        new_group = "GRI"
        action = "Reduce dose or remove one drug"
    else:
        new_group = current_group
        action = "Unknown response"

    rec = riders[riders["HTN_Gr"].str.contains(new_group)]
    if rec.empty:
        return {"error": "No recommendation found"}

    rec_row = rec.sample(1).iloc[0]
    return {
        "Predicted_Group": current_group,
        "New_Group": new_group,
        "Confidence": confidence,
        "Recommended_Action": action,
        "Recommended_Class": rec_row.get("Final_Group", "Unknown"),
        "Suggested_Brands": rec_row.get("Brand_Names", "Not Found"),
        "Clinical_Note": rec_row.get("Note", "No additional note"),
    }


# ==============================================================
# LOCAL TEST
# ==============================================================
if __name__ == "__main__":
    initialize_model()
    print(adaptive_recommendation(155, 95, "Amlodipine 5 mg", "Still High"))
