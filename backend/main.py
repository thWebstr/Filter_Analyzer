import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.routes import router

app = FastAPI(
    title="FilterAnalyzer API",
    description="Analog and Digital Filter Design API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"message": "FilterAnalyzer API is running"}