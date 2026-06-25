import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import categories, health, items, search, shelves

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(title="Fridge Tracker API")

# TODO: restrict to App Runner URL once production URL is known
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(shelves.router)
app.include_router(items.router)
app.include_router(search.router)
app.include_router(categories.router)
