# AgriSense AI — Project Requirements Document

## 1. Project Title

**AgriSense AI: Intelligent Farm Management and Decision Support Platform for Small-Scale Farmers**

## 2. Project Description

AgriSense AI is a cloud-enabled agricultural management platform designed for village-level and small-scale farming communities. The system helps farmers and coordinators digitally manage farm plots, crop records, agricultural inputs, crop health reports, weather alerts, expense tracking, and AI-based recommendations.

The platform supports map-based land marking, image-based crop analysis, multilingual assistance, voice recommendations, and a simulation module for testing and demonstration. It is designed as a practical college project that can be implemented using free tools, local data, and a demo-ready architecture.

## 3. Problem Statement

Farmers often manage cultivation activities manually, which leads to poor record keeping, delayed detection of crop problems, weak planning of irrigation and spraying, and loss of historical farming data. Many farmers also struggle with language barriers and limited access to expert advice.

There is a need for a simple, affordable, and scalable digital platform that can help farmers and local coordinators organize farming data, monitor crop health, receive timely alerts, and make better decisions using AI support.

## 4. Project Objectives

- Digitize farm and crop records.
- Enable map-based plot registration and verification.
- Track fertilizer and pesticide usage.
- Provide weather-based alerts and recommendations.
- Analyze crop health using uploaded images.
- Support multilingual and voice-based interaction.
- Track expenses and cultivation history.
- Provide simulation scenarios for demo and testing.
- Build a future-ready foundation for smart agriculture.

## 5. Scope of the Project

### 5.1 In-Scope Features

- Admin/coordinator login and management.
- Farmer registration and profile management.
- Farm plot creation using maps.
- Crop lifecycle tracking.
- Fertilizer and pesticide logging.
- OCR-based label reading from packet images.
- Crop image upload and AI-based health analysis.
- Weather API integration.
- Expense tracking.
- Multilingual text output.
- Voice note / text-to-speech recommendations.
- Simulation mode for artificial weather and crop condition testing.
- Local demo setup using free tools and a spare system as server.

### 5.2 Out-of-Scope for Current Version

- Real IoT sensor network deployment.
- Automatic pump control in live fields.
- Large-scale production hosting.
- Paid enterprise cloud infrastructure.
- Real-time drone surveillance.
- Full village-wide predictive analytics.

### 5.3 Future Scope

- Smart sensor poles for moisture, pH, humidity, temperature, and nutrient tracking.
- Remote motor control for irrigation.
- Predictive fertilizer and pesticide suggestions.
- Yield estimation and disease forecasting.
- Research dashboard for academic analysis.
- Village-level digital twin for agricultural monitoring.

## 6. User Roles

### 6.1 Admin / Coordinator

A village-level coordinator, agri-consultant, educated volunteer, or local farming advisor who manages a group of farmers.

Responsibilities:

- Register farmers.
- Verify farm plots.
- Monitor farmer records.
- Review crop health warnings.
- Help farmers interpret AI recommendations.
- Handle queries and support.
- Maintain group-level oversight.

### 6.2 Farmer

The primary user who manages individual fields and farming activities.

Responsibilities:

- Register plots.
- Add crop and input details.
- Upload images of crops and packets.
- View recommendations and alerts.
- Track expenses and irrigation logs.
- Use voice and multilingual support.

### 6.3 System / AI Services

Background services that process images, weather data, translations, recommendation logic, and simulation scenarios.

## 7. Core Modules

### 7.1 Authentication and Access Control

- Login and logout.
- Role-based access.
- Admin and farmer permissions.
- Secure session handling.
- Basic password protection.

### 7.2 Farmer Management

- Add farmer profile.
- Store name, contact, village, language preference, and optional notes.
- Edit and update farmer details.
- View farmer activity history.

### 7.3 Plot / Farm Land Management

- Mark farm land on map.
- Store multiple plots per farmer.
- Save location coordinates.
- Capture approximate area and boundaries.
- Admin verification of plot entries.

### 7.4 Crop Management

- Add crop name.
- Store seed variety and brand.
- Record sowing date and expected harvest date.
- Record crop stage.
- Maintain crop history for each plot.

### 7.5 Agricultural Input Tracking

- Fertilizer name and quantity.
- Pesticide name and quantity.
- Spray date and time.
- Application notes.
- Packet image upload.
- OCR extraction for label details.

### 7.6 Crop Health Monitoring

- Upload crop images at intervals.
- AI-based health analysis.
- Detect visible stress, pest damage, nutrient deficiency, and disease symptoms.
- Show health score or status.
- Save analysis history.

### 7.7 Weather Intelligence

- Location-based weather fetch.
- Rain forecast.
- Heat warning.
- Drought warning.
- Humidity and temperature display.
- Alert generation for important weather events.

### 7.8 Irrigation / Water Tracking

- Manual irrigation entry.
- Motor run start/stop logging.
- Estimated water usage.
- Record watering dates.
- Support future sensor integration.

### 7.9 Expense Management

- Seed expense.
- Fertilizer expense.
- Pesticide expense.
- Labor expense.
- Irrigation expense.
- Miscellaneous farming cost.
- Total crop-wise cost summary.

### 7.10 Recommendation Engine

- Suggest actions based on crop history, weather, and input logs.
- Recommend waiting for rain before fertilizer application if needed.
- Highlight possible nutrient deficiency.
- Suggest crop care actions in simple language.

### 7.11 Multilingual Support

- English and regional language support.
- Localized UI labels.
- Localized alert messages.
- Localized recommendations.

### 7.12 Voice Support

- Text-to-speech for recommendations.
- Voice notes for quick farmer input.
- Spoken weather and crop alerts.
- Support for elderly or low-literacy users.

### 7.13 Simulation Module

- Simulate rainfall.
- Simulate drought.
- Simulate crop disease.
- Simulate pest outbreaks.
- Simulate irrigation events.
- Simulate power outage / load shedding if needed.
- Used for demo and testing without relying on real-world events.

### 7.14 Reporting and Dashboard

- Overview cards for farmers, plots, crops, and alerts.
- Seasonal crop summary.
- Input usage summary.
- Expense summary.
- Recent analysis and warnings.

## 8. Functional Requirements

### 8.1 Admin Side Requirements

- Admin shall be able to create farmer accounts.
- Admin shall be able to verify farm plots.
- Admin shall be able to see all registered farmers.
- Admin shall be able to see crop and alert history.
- Admin shall be able to review simulation output.
- Admin shall be able to respond to farmer queries.

### 8.2 Farmer Side Requirements

- Farmer shall be able to create and update profile.
- Farmer shall be able to add farm plots.
- Farmer shall be able to add crop details.
- Farmer shall be able to upload crop images.
- Farmer shall be able to upload fertilizer/pesticide packet images.
- Farmer shall be able to view AI suggestions.
- Farmer shall be able to hear recommendations in voice form.
- Farmer shall be able to see weather alerts.
- Farmer shall be able to view expense records.

### 8.3 System Requirements

- System shall store all records in a database.
- System shall process images through AI/OCR.
- System shall fetch weather data through API.
- System shall translate or localize output based on user language.
- System shall generate demo scenarios in simulation mode.

## 9. Non-Functional Requirements

### 9.1 Usability

- The system must be simple enough for non-technical users.
- Important actions must take only a few clicks.
- Voice support should reduce typing effort.

### 9.2 Performance

- The system should load dashboard data quickly.
- Image analysis should complete within acceptable demo time.
- Weather and recommendation updates should not block the main app.

### 9.3 Scalability

- The architecture should support more farmers and plots later.
- Future cloud deployment should be possible.
- Sensor and remote-control modules should be addable later.

### 9.4 Reliability

- Records must not be lost easily.
- Core functions should work even in demo/local-server mode.
- The system should handle missing weather data gracefully.

### 9.5 Security

- Role-based login.
- Protected access to farmer records.
- Basic validation on forms.
- Safe storage of uploaded images.

### 9.6 Maintainability

- Modular code structure.
- Separate modules for UI, API, AI, and database.
- Clear naming and documentation.

## 10. Data Requirements

### 10.1 Farmer Data

- Farmer ID
- Name
- Phone number
- Village name
- Preferred language
- Role
- Notes

### 10.2 Farm Plot Data

- Plot ID
- Farmer ID
- Plot name
- Coordinates
- Approximate area
- Verification status
- Map reference

### 10.3 Crop Data

- Crop ID
- Plot ID
- Crop name
- Seed variety
- Seed brand
- Sowing date
- Harvest date
- Crop stage

### 10.4 Input Data

- Input type
- Product name
- Brand
- Quantity
- Application date
- Application notes
- Image reference

### 10.5 Crop Health Data

- Image ID
- Plot ID
- Upload date
- AI result
- Health score
- Recommendation text

### 10.6 Weather Data

- Location
- Temperature
- Humidity
- Rain probability
- Forecast date
- Alert status

### 10.7 Expense Data

- Expense ID
- Crop ID
- Category
- Amount
- Date
- Notes

### 10.8 Simulation Data

- Scenario type
- Input values
- Generated weather or crop state
- AI response
- Timestamp

## 11. Suggested User Workflows

### 11.1 Farmer Onboarding Flow

1. Admin creates farmer account.
2. Farmer logs in.
3. Farmer updates profile and language preference.
4. Farmer adds plot details.
5. Admin verifies plot.

### 11.2 Crop Registration Flow

1. Farmer selects a plot.
2. Farmer enters crop and seed details.
3. Farmer saves crop record.
4. System stores crop history.

### 11.3 Fertilizer / Pesticide Logging Flow

1. Farmer uploads packet image.
2. OCR extracts text.
3. Farmer confirms or edits extracted details.
4. System saves the product record.

### 11.4 Crop Monitoring Flow

1. Farmer uploads crop photo.
2. AI analyzes the image.
3. System generates status and recommendation.
4. Farmer can hear or read the output.

### 11.5 Weather Alert Flow

1. System checks weather API.
2. Weather risk is detected.
3. App shows
