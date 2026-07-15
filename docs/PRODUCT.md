# Product Spec

## Problem

People forget what's in their fridge. This leads to two specific failures:
1. **Duplicate purchases**: buying spinach when there's already spinach
2. **Food waste**: fresh ingredients rot before being used

This affects the owner (Lausanne, partner-shared fridge) and the owner's parents (separate fridge, same problem).

## Users (v1)

A single user managing a single fridge. No accounts, no auth, no sharing in v1.

The data model leaves room for multi-user and multi-place expansion, but v1 ships as a single-fridge personal tool.

## v1 scope (the meetup demo)

What v1 does:

- Customizable shelves: add, rename, reorder, delete
- Add items to a shelf with: name, quantity, unit, category, expiration date
- Items show with category icon and color-coded expiration status
- Edit, delete, move items between shelves
- Search items across the fridge

Expiration colors (computed in the frontend, not stored):

- **Fresh** (green): expires more than 3 days from now, or no expiration set
- **Expiring soon** (amber): expires within 3 days
- **Expired** (red): expiration date has passed

Categories (fixed list in v1):

🥦 vegetables · 🍎 fruits · 🧀 dairy · 🥩 meat · 🐟 fish · 🍱 leftovers · 🫙 condiments · 🧃 drinks · 🧊 frozen · 🌾 grains · 📦 other

## Roadmap (post-v1, not in scope now)

These are listed so the data model accommodates them, but they are explicitly out of scope for v1.

**Phase 2** (post-demo, decisions finalized — see `docs/PHASE_2_DECISIONS.md`):
- Authentication: AWS Cognito (User Pools), JWT verification in FastAPI
- Sharing model: symmetric shared fridge entity, full access for all members, no roles
- Sync strategy: refetch on foreground via AppState listener, no real-time/WebSocket
- Distribution: TestFlight (closed audience — owner + partner + parents)
- Multi-place support (your fridge + parents' fridge) — follows from the fridge entity above
- Push notifications for expiring items

**Phase 3**:
- Photo recognition: snap a photo of groceries, auto-add to fridge (Python ML microservice)
- Drag-and-drop to reposition items
- Multilingual UI: English, French, German, Korean

**Phase 4**:
- Recipe suggestions based on what's in the fridge
- Shopping list integration

## Non-goals

- This is not a meal-planning app
- This is not a calorie or nutrition tracker
- This is not a barcode scanner
- This is not a competitor to NoWaste, KitchenPal, or Fridgely — it's a portfolio + personal tool

## Success criteria for v1

A demo that runs at the meetup, where:

1. The owner shows the live app on their phone
2. Audience scans a QR code, opens it on their own phones, adds an item to the fridge, and sees it appear on the owner's phone
3. Architecture diagram explains the FastAPI + React Native + AWS ECS Fargate + RDS Postgres deployment
4. The owner can speak confidently about every architectural choice

After the demo, the owner uses the app daily with their partner. That's the real test.
