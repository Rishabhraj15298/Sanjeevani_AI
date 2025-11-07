from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from merge_and_train import initialize_model, adaptive_recommendation
import uvicorn
import json

app = FastAPI(title="BP Prescription ML API", version="2.0")

# CORS for Node.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize once on startup
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting BP ML API service on http://127.0.0.1:8001 ...")
    initialize_model()
    print("✅ Model loaded and ready for inference.")


@app.post("/adaptive")
async def adaptive_api(request: Request):
    try:
        body = await request.json()
        bp_sys = float(body.get("systolic", 0))
        bp_dia = float(body.get("diastolic", 0))
        current_med = body.get("current_med", "")
        response = body.get("response", "normal")

        print(f"🧠 Incoming Request: Sys={bp_sys}, Dia={bp_dia}, Med={current_med}, Resp={response}")

        result = adaptive_recommendation(bp_sys, bp_dia, current_med, response)
        # Safely clean NaN for JSON
        for k, v in result.items():
            if isinstance(v, float) and (v != v):  # NaN check
                result[k] = None

        return {"success": True, "result": result}
    except Exception as e:
        print(f"❌ Error in /adaptive: {e}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
