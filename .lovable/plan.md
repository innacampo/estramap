

# EstraMap – Community Estradiol Patch Tracker

## Overview
A crowdsourced web app helping women locate in-stock estradiol patches during medication shortages. The design will be empowering, accessible, and trustworthy with a deep teal, soft lavender, and crisp white color palette.

## Design System
- **Primary:** Deep teal for headers, buttons, and key UI elements
- **Secondary:** Soft lavender for backgrounds, cards, and accents
- **Status colors:** Green for "In Stock", amber/yellow for "Low Stock", red for "Out of Stock"
- **Typography:** Clean, readable fonts with strong hierarchy
- **Overall feel:** Calming, clinical trustworthiness meets community warmth

## Features

### 1. Header & Navigation
- "EstraMap" branding with a map pin icon
- Prominent search bar with placeholder: "Enter your address or zip code to find patches near you"
- "+ Report Found Stock" CTA button that opens the report modal

### 2. Main Content – Two-Column Layout (Desktop) / Stacked (Mobile)

#### Left Column: The Feed
- **Tab toggle** between "Local Pharmacies" and "Online/Mail-Order"
- **Local Pharmacy Cards** showing:
  - Pharmacy name & address/distance
  - Medication details (e.g., "Dotti 0.05mg", "Generic Estradiol 0.1mg")
  - Color-coded status badge (green = In Stock, yellow = Low Stock)
  - Time since report ("Reported 2 hours ago")
  - "Still accurate?" Yes/No voting buttons
- **Online Pharmacy Cards** showing:
  - Pharmacy name (Amazon Pharmacy, Cost Plus Drugs, Honeybee, etc.)
  - Patch/dose found, date reported
  - "Visit Pharmacy" link button

#### Right Column: Interactive Map
- Map view using react-leaflet with OpenStreetMap tiles
- Color-coded pins matching local feed data (green/yellow)
- Hovering a feed card highlights the corresponding map pin
- On mobile: map moves to top or becomes a toggleable full-screen overlay

### 3. "Report Stock" Modal
- Multi-step clean form:
  - **Step 1:** Toggle between Local Pharmacy / Online Pharmacy
  - **Step 2 (Local):** Pharmacy name + address/zip inputs
  - **Step 2 (Online):** Website URL/name input
  - **Step 3:** Medication type dropdown + dose selector (0.025, 0.05, 0.075, 0.1 mg)
  - **Step 4:** Status selection – "In Stock" or "Low Stock / Only a few left"
  - **Submit:** "Share with the Community" button

### 4. Mock Data
- 4+ local pharmacy reports across different locations with varied statuses and medications
- 2+ online pharmacy success reports
- All data populated on first load so the app feels alive

### 5. Responsiveness
- Desktop: side-by-side feed + map layout
- Mobile: stacked layout with map as a toggleable full-screen view
- Fully accessible with proper ARIA labels, focus management, and keyboard navigation

### Technical Notes
- All data is client-side mock data (no backend needed for this version)
- react-leaflet for the map component
- Tailwind CSS for styling, Lucide React for icons
- shadcn/ui components for modal, tabs, buttons, forms, badges

