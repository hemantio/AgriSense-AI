"""
AgriSense AI — RAG Knowledge Seeding Script
===============================================
Seeds the knowledge_embeddings table with verified agricultural knowledge
for Retrieval Augmented Generation (RAG).

Usage:
    cd server
    python seed_knowledge.py

Categories:
    - crop_manual      : Growing guides, stage-wise care
    - disease_db       : Symptoms, causes, treatments
    - govt_scheme      : PM-KISAN, PMFBY, subsidies
    - best_practice    : Regional farming advice
    - fertilizer_guide : Approved products, usage guidelines (NOT dosages)
"""

import asyncio
import sys
import os

# Ensure the server package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import async_session_factory, init_db
from app.services.ai.vector_store import VectorStoreService
from app.utils.logger import get_logger

logger = get_logger("agrisense.cie.seed_knowledge")

# ──────────────────────────────────────────────────
# KNOWLEDGE CHUNKS
# ──────────────────────────────────────────────────

KNOWLEDGE_CHUNKS = [
    # ── Crop Manuals ──────────────────────────────
    {
        "source": "crop_manual",
        "title": "Wheat (Gehun) Growing Guide — Rabi Season",
        "content": (
            "Wheat is a major Rabi crop sown from October to December in India. "
            "It requires cool weather during growth and warm, dry weather during harvest. "
            "Ideal soil: well-drained loamy soil with pH 6.0-7.5. "
            "Growth stages: Germination (7-10 days) → Tillering (25-30 days) → "
            "Jointing (40-50 days) → Heading (55-65 days) → Grain filling (70-90 days) → "
            "Maturity (110-130 days). "
            "Key care: First irrigation 20-25 days after sowing (Crown Root Initiation). "
            "Total 4-6 irrigations needed. Avoid waterlogging. "
            "Nitrogen is critical during tillering stage for yield."
        ),
        "metadata": {"crop": "wheat", "season": "rabi", "language": "en"},
        "region": "North India",
        "language": "en"
    },
    {
        "source": "crop_manual",
        "title": "Cotton (Kapas) Growing Guide — Kharif Season",
        "content": (
            "Cotton is a major Kharif cash crop sown from May to July. "
            "Requires warm climate with 21-30°C and moderate rainfall. "
            "Ideal soil: black cotton soil (vertisol) with good water-holding capacity. "
            "Growth stages: Emergence (7-14 days) → Squaring (35-45 days) → "
            "Flowering (50-65 days) → Boll development (65-100 days) → "
            "Boll opening (100-140 days) → Picking (140-170 days). "
            "Key pests: Bollworm, whitefly, jassids. Monitor regularly. "
            "Key diseases: Bacterial blight, fusarium wilt. "
            "Picking should be done when 60% bolls are open. "
            "Multiple pickings (3-4) give better quality cotton."
        ),
        "metadata": {"crop": "cotton", "season": "kharif", "language": "en"},
        "region": "Maharashtra",
        "language": "en"
    },
    {
        "source": "crop_manual",
        "title": "Tomato (Tamatar) Growing Guide",
        "content": (
            "Tomato can be grown in both Kharif and Rabi seasons. "
            "Optimal temperature: 20-25°C. Sensitive to frost and extreme heat. "
            "Ideal soil: well-drained sandy loam with pH 6.0-7.0. "
            "Transplanting: 25-30 day old seedlings, spacing 60x45 cm. "
            "Growth stages: Transplanting → Vegetative (20-30 days) → "
            "Flowering (30-45 days) → Fruiting (45-70 days) → Harvest (70-90 days). "
            "Key care: Staking required for indeterminate varieties. "
            "Common issues: Early blight, late blight, fruit borer, leaf curl virus. "
            "Harvest when fruits are pink to light red for longer shelf life."
        ),
        "metadata": {"crop": "tomato", "season": "both", "language": "en"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "crop_manual",
        "title": "Rice (Dhaan) Growing Guide — Kharif Season",
        "content": (
            "Rice is the primary Kharif crop in India, sown June-July. "
            "Requires standing water during most of its growth period. "
            "Ideal soil: clayey to clay-loam with good water retention. "
            "Growth stages: Nursery (20-25 days) → Transplanting → "
            "Tillering (25-30 days after transplanting) → Panicle initiation (50-60 days) → "
            "Heading (70-80 days) → Grain filling (80-100 days) → Maturity (110-130 days). "
            "Key care: Maintain 5 cm standing water during vegetative growth. "
            "Drain field 7-10 days before harvest. "
            "Major pests: Stem borer, leaf folder, BPH (Brown Plant Hopper)."
        ),
        "metadata": {"crop": "rice", "season": "kharif", "language": "en"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "crop_manual",
        "title": "Soybean Growing Guide — Kharif Season",
        "content": (
            "Soybean is a major Kharif oilseed crop sown in June-July. "
            "Optimal temperature: 26-30°C. Well-drained loamy soil preferred. "
            "Growth stages: Germination (5-7 days) → Vegetative (30-40 days) → "
            "Flowering (40-55 days) → Pod development (55-80 days) → "
            "Maturity (90-110 days). "
            "Key care: Seed treatment with Rhizobium culture before sowing. "
            "Inter-cultivation at 20-25 days for weed control. "
            "Harvest when 95% pods turn brown and leaves start falling."
        ),
        "metadata": {"crop": "soybean", "season": "kharif", "language": "en"},
        "region": "Madhya Pradesh",
        "language": "en"
    },

    # ── Disease Database ─────────────────────────
    {
        "source": "disease_db",
        "title": "Early Blight (Alternaria) in Tomato",
        "content": (
            "Early blight caused by Alternaria solani is very common in tomato. "
            "Symptoms: Dark brown concentric ring spots on lower leaves first, then spread upward. "
            "Leaves turn yellow and drop. Stem lesions may appear. Fruits show dark sunken spots. "
            "Favourable conditions: Warm humid weather (24-29°C), poor air circulation. "
            "Prevention: Use disease-free seeds, crop rotation (3 years), remove infected debris. "
            "Maintain good spacing for air circulation. "
            "Treatment: Contact your local Krishi Vigyan Kendra (KVK) for approved fungicides. "
            "IMPORTANT: Do not apply any chemical without expert guidance on dosage."
        ),
        "metadata": {"crop": "tomato", "disease": "early_blight", "severity": "medium"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "disease_db",
        "title": "Rust (Geru Rog) in Wheat",
        "content": (
            "Wheat rust is caused by Puccinia species. Three types: brown/leaf rust, "
            "yellow/stripe rust, and black/stem rust. "
            "Symptoms: Small orange-brown or yellow pustules on leaves and stems. "
            "Severe infection reduces grain filling and causes shrivelled grains. "
            "Favourable conditions: Cool, moist weather (15-25°C), cloudy skies. "
            "Prevention: Grow resistant varieties recommended by ICAR for your region. "
            "Early sowing helps avoid peak rust season. "
            "Treatment: Contact local agricultural officer for approved fungicide spray timing."
        ),
        "metadata": {"crop": "wheat", "disease": "rust", "severity": "high"},
        "region": "North India",
        "language": "en"
    },
    {
        "source": "disease_db",
        "title": "Bollworm Infestation in Cotton",
        "content": (
            "American bollworm (Helicoverpa armigera) is the most damaging pest of cotton. "
            "Symptoms: Bore holes in squares, flowers, and bolls. Frass (excreta) visible at entry point. "
            "Larvae feed inside bolls causing premature boll opening and lint damage. "
            "Prevention: Use Bt cotton varieties, install pheromone traps (5/acre), "
            "maintain bird perches (20/acre), neem seed kernel extract spray. "
            "Scouting: Check 20 random plants, if >5% have bollworm damage, seek expert help. "
            "IMPORTANT: Never mix multiple pesticides. Always consult Krishi Adhikari for chemical control."
        ),
        "metadata": {"crop": "cotton", "disease": "bollworm", "severity": "high"},
        "region": "Maharashtra",
        "language": "en"
    },
    {
        "source": "disease_db",
        "title": "Nitrogen Deficiency in Crops",
        "content": (
            "Nitrogen deficiency is one of the most common nutrient problems. "
            "Symptoms: Lower/older leaves turn pale green to yellow (chlorosis). "
            "Stunted growth, thin stems, poor tillering. Plants look 'hungry'. "
            "Commonly seen in: Wheat during tillering, rice during vegetative stage, "
            "tomato during rapid growth. "
            "Causes: Insufficient fertilizer, waterlogged soils, sandy soils with leaching. "
            "Quick fix: Foliar spray of 2% urea solution for immediate correction. "
            "Long-term: Soil testing recommended every season. "
            "IMPORTANT: Do not exceed recommended urea quantity — burns crops."
        ),
        "metadata": {"deficiency": "nitrogen", "type": "nutrient"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "disease_db",
        "title": "Whitefly Infestation — Multiple Crops",
        "content": (
            "Whitefly (Bemisia tabaci) is a major pest affecting cotton, tomato, chilli, and okra. "
            "Symptoms: Tiny white flying insects on leaf undersides. Honeydew secretion. "
            "Sooty mold on leaves. Leaf curl virus transmission in tomato. "
            "Favourable conditions: Dry, warm weather (30-35°C). "
            "Prevention: Yellow sticky traps (15/acre), remove weed hosts, "
            "avoid excessive nitrogen fertilizer (promotes succulent growth). "
            "Biological control: Release of Encarsia formosa parasitoid. "
            "IMPORTANT: Whitefly transmits virus diseases — early detection is critical."
        ),
        "metadata": {"pest": "whitefly", "crops": ["cotton", "tomato", "chilli"]},
        "region": "All India",
        "language": "en"
    },

    # ── Government Schemes ────────────────────────
    {
        "source": "govt_scheme",
        "title": "PM-KISAN — Pradhan Mantri Kisan Samman Nidhi",
        "content": (
            "PM-KISAN provides income support of ₹6,000 per year to land-holding farmer families. "
            "Amount paid in 3 equal installments of ₹2,000 every 4 months directly to bank account. "
            "Eligibility: All land-holding farmer families (subject to exclusion criteria). "
            "Exclusion: Institutional land holders, former/current ministers, income tax payers, "
            "professionals like doctors, engineers, lawyers, chartered accountants. "
            "How to apply: Visit nearest Common Service Centre (CSC) or apply online at pmkisan.gov.in. "
            "Documents needed: Aadhaar card, bank account details, land records. "
            "IMPORTANT: Verify scheme details and your eligibility at your nearest Gram Sevak office "
            "or CSC. Government schemes change periodically."
        ),
        "metadata": {"scheme": "pm_kisan", "type": "income_support"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "govt_scheme",
        "title": "PMFBY — Pradhan Mantri Fasal Bima Yojana",
        "content": (
            "PMFBY is the government's crop insurance scheme for farmers. "
            "Premium: Kharif crops 2% of sum insured, Rabi crops 1.5%, commercial/horticultural 5%. "
            "Coverage: Natural calamities, pest/disease attacks, post-harvest losses (up to 14 days). "
            "Covers: Standing crops, prevented sowing, post-harvest losses, localized calamities. "
            "How to apply: Through bank (if you have a crop loan) or at CSC with Aadhaar, "
            "bank passbook, land records, and sowing certificate. "
            "Claim process: Report crop loss to insurance company or through Crop Insurance App. "
            "IMPORTANT: Enrollment must be done before the cut-off date for each season. "
            "Check with your bank or local agricultural office for exact dates and eligible crops."
        ),
        "metadata": {"scheme": "pmfby", "type": "crop_insurance"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "govt_scheme",
        "title": "Soil Health Card Scheme",
        "content": (
            "Government scheme providing soil health cards to farmers every 2 years. "
            "The card contains soil nutrient status and recommended fertilizer dosage. "
            "Nutrients tested: N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, organic carbon. "
            "Benefits: Helps farmers know exact nutrient needs of their soil. "
            "Reduces unnecessary fertilizer use, saves money, and protects soil health. "
            "How to get: Contact nearest Krishi Vigyan Kendra or agricultural department. "
            "Free of cost to farmers. "
            "IMPORTANT: Follow the recommendations on the soil health card for best results. "
            "Get card renewed every 2 years as soil nutrient status changes."
        ),
        "metadata": {"scheme": "soil_health_card", "type": "soil_testing"},
        "region": "All India",
        "language": "en"
    },

    # ── Fertilizer Guides ─────────────────────────
    {
        "source": "fertilizer_guide",
        "title": "DAP (Di-Ammonium Phosphate) — Usage Guidelines",
        "content": (
            "DAP is one of the most widely used phosphatic fertilizers in India. "
            "Contains: 18% Nitrogen (N) and 46% Phosphorus (P2O5). "
            "Best used as: Basal application at the time of sowing/transplanting. "
            "Crops: Beneficial for wheat, rice, maize, cotton, soybean, and vegetables. "
            "Application: Place in seed furrows or near root zone. "
            "Timing: Apply at or before sowing. Not effective as top dressing for phosphorus. "
            "Storage: Keep in dry place, away from moisture. "
            "IMPORTANT: Exact dosage depends on soil test results and crop requirement. "
            "Consult your Soil Health Card or Krishi Adhikari for recommended quantity per acre."
        ),
        "metadata": {"product": "DAP", "type": "fertilizer"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "fertilizer_guide",
        "title": "Urea — Usage Guidelines",
        "content": (
            "Urea is the most common nitrogenous fertilizer, containing 46% Nitrogen. "
            "Application methods: Broadcast, band placement, or foliar spray (2% solution). "
            "Best practice: Split application — do NOT apply entire amount at once. "
            "For wheat: Apply in 3 splits (basal, tillering, heading stage). "
            "For rice: Apply in 3 splits (transplanting, active tillering, panicle initiation). "
            "Caution: Apply to moist soil for better absorption. "
            "Avoid applying during heavy rain (nitrogen washes away). "
            "Avoid applying during mid-day heat (nitrogen volatilizes). "
            "IMPORTANT: Over-application causes crop burning and lodging. "
            "Always follow Soil Health Card recommended dosage."
        ),
        "metadata": {"product": "urea", "type": "fertilizer"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "fertilizer_guide",
        "title": "MOP (Muriate of Potash) — Usage Guidelines",
        "content": (
            "MOP contains 60% Potassium (K2O). Essential for crop quality and disease resistance. "
            "Benefits: Improves fruit quality, grain weight, and drought tolerance. "
            "Strengthens stems (reduces lodging in wheat and rice). "
            "Application: Basal or split (basal + top dressing at flowering). "
            "Important for: Potato, banana, sugarcane, tomato, and fruit crops. "
            "Caution: Do not apply excess MOP to tobacco, grapes, and some fruits. "
            "Chloride in MOP can affect quality of chloride-sensitive crops. "
            "Use SOP (Sulphate of Potash) for sensitive crops. "
            "IMPORTANT: Dosage based on soil test. Consult local agricultural extension officer."
        ),
        "metadata": {"product": "MOP", "type": "fertilizer"},
        "region": "All India",
        "language": "en"
    },

    # ── Best Practices ────────────────────────────
    {
        "source": "best_practice",
        "title": "Spray Safety — When NOT to Spray Pesticides",
        "content": (
            "NEVER spray pesticides in the following conditions: "
            "1. If rain is expected within 4-6 hours (spray will wash off, wasted money). "
            "2. Wind speed above 15 km/h (spray drift harms other crops and people). "
            "3. Temperature above 35°C (chemicals evaporate quickly, less effective). "
            "4. During flowering stage of the crop (harms pollinating bees). "
            "5. Within 2 weeks of harvest (chemical residue in food). "
            "Best spray time: Early morning (6-9 AM) or late afternoon (4-6 PM). "
            "Safety: Wear protective gear — mask, gloves, long sleeves. "
            "Wash hands and face thoroughly after spraying. Do not eat or drink while spraying."
        ),
        "metadata": {"topic": "spray_safety", "type": "safety"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "best_practice",
        "title": "Water Management — Efficient Irrigation Practices",
        "content": (
            "Indian agriculture uses 80% of freshwater resources. Efficient irrigation is critical. "
            "Methods (most to least efficient): "
            "1. Drip irrigation — 90% efficiency, best for horticulture and vegetables. "
            "2. Sprinkler — 75% efficiency, good for wheat, pulses. "
            "3. Furrow — 50-60% efficiency, common for row crops. "
            "4. Flood irrigation — 30-40% efficiency, most wasteful. "
            "Best practices: Irrigate in morning or evening (less evaporation). "
            "Check soil moisture before irrigating — avoid over-watering. "
            "Critical stages for irrigation: "
            "- Wheat: Crown Root Initiation (21 days), tillering, heading, grain filling. "
            "- Rice: Maintain thin layer of water, not deep flooding. "
            "Subsidies: Many states provide subsidy for drip/sprinkler systems."
        ),
        "metadata": {"topic": "irrigation", "type": "water_management"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "best_practice",
        "title": "Integrated Pest Management (IPM) for Small Farmers",
        "content": (
            "IPM is a sustainable approach to managing pests that minimizes chemical use. "
            "Steps: 1. Prevention — crop rotation, resistant varieties, clean seeds. "
            "2. Monitoring — Regular field scouting, use pheromone traps. "
            "3. Cultural control — timely sowing, proper spacing, intercropping. "
            "4. Biological control — encourage natural enemies (ladybugs eat aphids). "
            "5. Chemical control — LAST resort, use recommended pesticides only. "
            "Economic Threshold Level (ETL): Only spray when pest population crosses ETL. "
            "Neem-based products: Safe, effective for many pests, and farmer-friendly. "
            "IMPORTANT: Never mix multiple pesticides without expert advice. "
            "Contact your local KVK or Agricultural Officer for pest identification and advice."
        ),
        "metadata": {"topic": "ipm", "type": "pest_management"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "best_practice",
        "title": "Soil Testing and Health — Why It Matters",
        "content": (
            "Soil testing is the foundation of smart farming. It tells you exactly what your soil needs. "
            "Without soil testing, farmers often over-apply or under-apply fertilizers. "
            "Over-application: Wastes money and damages soil long-term. "
            "Under-application: Reduces yield and farm income. "
            "What to test: pH, organic carbon, available N-P-K, micronutrients (Zn, Fe, B). "
            "When to test: Once every 2 years, preferably before sowing season. "
            "How to collect sample: Take soil from 6-8 spots in the field at 15 cm depth. "
            "Mix all samples, take 500g and send to nearest soil testing lab. "
            "Cost: Free under Soil Health Card scheme at government labs. "
            "Private labs: ₹200-500 per sample."
        ),
        "metadata": {"topic": "soil_testing", "type": "soil_health"},
        "region": "All India",
        "language": "en"
    },
    {
        "source": "best_practice",
        "title": "Post-Harvest Management — Reducing Crop Losses",
        "content": (
            "India loses 15-20% of food grains post-harvest due to poor storage and handling. "
            "Harvesting: Harvest at correct moisture content (wheat 12-14%, rice 20-22%). "
            "Drying: Sun-dry grains on clean threshing floor or tarpaulin until moisture drops. "
            "Storage tips: Clean storage area thoroughly. Use hermetic storage bags or metal bins. "
            "Keep grains away from walls and floor — use wooden planks. "
            "Pest control in storage: Neem leaves mixed with grain (traditional method). "
            "Check stored grains every 2 weeks for insect damage or moisture. "
            "Marketing: Sell through APMCs, eNAM (electronic market), or FPOs for better price. "
            "Government procurement: Register with local procurement center for MSP."
        ),
        "metadata": {"topic": "post_harvest", "type": "storage"},
        "region": "All India",
        "language": "en"
    },

    # ── Hindi Crop Guides ─────────────────────────
    {
        "source": "crop_manual",
        "title": "गेहूं की खेती — रबी सीजन गाइड (Hindi)",
        "content": (
            "गेहूं रबी सीजन की प्रमुख फसल है। बुवाई का समय अक्टूबर-नवंबर है। "
            "अच्छी पैदावार के लिए दोमट मिट्टी सबसे अच्छी होती है। "
            "बुवाई के 20-25 दिन बाद पहली सिंचाई ज़रूरी है (पौधे की जड़ बनने का समय)। "
            "कुल 4-6 सिंचाई चाहिए। गेहूं में कल्ले निकलते समय यूरिया की टॉप ड्रेसिंग करें। "
            "कटाई मार्च-अप्रैल में जब दाना सख्त हो जाए। "
            "प्रमुख रोग: गेरुआ (रस्ट), कर्नाल बंट। रोग प्रतिरोधक किस्में लगाएं। "
            "महत्वपूर्ण: बीज उपचार करके ही बुवाई करें।"
        ),
        "metadata": {"crop": "wheat", "season": "rabi", "language": "hi"},
        "region": "North India",
        "language": "hi"
    },
    {
        "source": "crop_manual",
        "title": "कपास की खेती — खरीफ सीजन गाइड (Hindi)",
        "content": (
            "कपास खरीफ सीजन की नकदी फसल है। बुवाई मई-जून में करें। "
            "काली मिट्टी कपास के लिए सबसे उत्तम है। "
            "बीटी कपास की किस्में सबसे ज़्यादा लगाई जाती हैं। "
            "फूल आने पर और टिंडे बनने पर सिंचाई बहुत ज़रूरी है। "
            "प्रमुख कीट: सुंडी (बॉलवर्म), सफेद मक्खी, हरा तेला। "
            "फेरोमोन ट्रैप लगाएं (5 प्रति एकड़)। नीम का तेल छिड़काव उपयोगी है। "
            "चुनाई जब 60% टिंडे खुल जाएं। 3-4 बार चुनाई करें। "
            "महत्वपूर्ण: कीटनाशक की सही मात्रा के लिए कृषि अधिकारी से सलाह लें।"
        ),
        "metadata": {"crop": "cotton", "season": "kharif", "language": "hi"},
        "region": "Maharashtra",
        "language": "hi"
    },
    {
        "source": "crop_manual",
        "title": "टमाटर की खेती गाइड (Hindi)",
        "content": (
            "टमाटर की खेती रबी और खरीफ दोनों में की जा सकती है। "
            "नर्सरी में पौधे तैयार करके 25-30 दिन बाद रोपाई करें। "
            "कतार से कतार 60 सेमी और पौधे से पौधे 45 सेमी की दूरी रखें। "
            "स्टेकिंग (सहारा देना) ज़रूरी है — पौधे गिरते नहीं और फल सड़ते नहीं। "
            "प्रमुख रोग: अगेती झुलसा (अर्ली ब्लाइट), पिछेती झुलसा (लेट ब्लाइट)। "
            "फल जब हल्के गुलाबी हो जाएं तब तोड़ें — दूर बाज़ार भेजने के लिए अच्छा। "
            "पीले पत्ते: नाइट्रोजन की कमी या रोग हो सकता है। फोटो भेजें जांच के लिए। "
            "महत्वपूर्ण: रोग की पहचान के लिए नज़दीकी KVK से संपर्क करें।"
        ),
        "metadata": {"crop": "tomato", "season": "both", "language": "hi"},
        "region": "All India",
        "language": "hi"
    },

    # ── Hindi Best Practices ──────────────────────
    {
        "source": "best_practice",
        "title": "छिड़काव की सही विधि — कब छिड़काव न करें (Hindi)",
        "content": (
            "कीटनाशक छिड़काव के नियम: "
            "1. बारिश आने वाली हो तो छिड़काव न करें (दवा बह जाएगी)। "
            "2. तेज हवा (15 किमी/घंटा से ज़्यादा) में छिड़काव न करें। "
            "3. दोपहर की तेज धूप (35°C से ज़्यादा) में न करें। "
            "4. फसल में फूल आए हों तो न करें (मधुमक्खियों को नुकसान)। "
            "5. कटाई से 15 दिन पहले छिड़काव बंद करें। "
            "सबसे अच्छा समय: सुबह 6-9 बजे या शाम 4-6 बजे। "
            "सुरक्षा: मास्क, दस्ताने, पूरी बाजू के कपड़े पहनें। "
            "छिड़काव के बाद हाथ-मुंह अच्छी तरह धोएं।"
        ),
        "metadata": {"topic": "spray_safety", "type": "safety", "language": "hi"},
        "region": "All India",
        "language": "hi"
    },
    {
        "source": "best_practice",
        "title": "मिट्टी जांच क्यों ज़रूरी है (Hindi)",
        "content": (
            "मिट्टी जांच से पता चलता है कि आपके खेत की मिट्टी में कौन सा तत्व कम है। "
            "बिना जांच के खाद डालने से: पैसे बर्बाद, मिट्टी खराब, फसल कम। "
            "कैसे करें: खेत के 6-8 जगहों से 15 सेमी गहराई से मिट्टी लें। "
            "सब मिलाकर 500 ग्राम नमूना बनाएं और सरकारी लैब भेजें। "
            "सरकारी मिट्टी जांच: मृदा स्वास्थ्य कार्ड योजना में मुफ़्त। "
            "हर 2 साल में जांच करवाएं, बुवाई से पहले। "
            "मृदा स्वास्थ्य कार्ड में लिखी सिफ़ारिश के अनुसार खाद डालें।"
        ),
        "metadata": {"topic": "soil_testing", "type": "soil_health", "language": "hi"},
        "region": "All India",
        "language": "hi"
    },

    # ── Marathi Crop Guide ────────────────────────
    {
        "source": "crop_manual",
        "title": "कापूस शेती मार्गदर्शक — खरीप हंगाम (Marathi)",
        "content": (
            "कापूस हा खरीप हंगामातील प्रमुख नगदी पीक आहे. पेरणी मे-जून मध्ये करावी. "
            "काळी कसदार जमीन कापसासाठी सर्वोत्तम आहे. "
            "बीटी कापसाच्या जाती सर्वाधिक लागवड केल्या जातात. "
            "फुलोरा व बोंड लागण्याच्या वेळी पाणी देणे अत्यंत आवश्यक. "
            "प्रमुख कीड: बोंड अळी, पांढरी माशी, तुडतुडे. "
            "कामगंध सापळे लावा (प्रति एकर 5). निंबोळी अर्काची फवारणी उपयुक्त. "
            "वेचणी 60% बोंडे उघडल्यावर करावी. 3-4 वेळा वेचणी करावी. "
            "महत्त्वाचे: कीटकनाशकाच्या योग्य मात्रेसाठी कृषी अधिकाऱ्यांचा सल्ला घ्या."
        ),
        "metadata": {"crop": "cotton", "season": "kharif", "language": "mr"},
        "region": "Maharashtra",
        "language": "mr"
    },

    # ── Maharashtra-specific ──────────────────────
    {
        "source": "best_practice",
        "title": "Maharashtra Drip Irrigation Subsidy Scheme",
        "content": (
            "Maharashtra government provides subsidy for micro-irrigation (drip and sprinkler). "
            "Subsidy: Up to 55% for general category, 80% for SC/ST and small/marginal farmers. "
            "Eligible crops: All horticulture, sugarcane, cotton, soybean, vegetables. "
            "How to apply: Online through MahaDBT portal (mahadbt.maharashtra.gov.in). "
            "Documents: 7/12 extract, Aadhaar, bank passbook, quotation from approved supplier. "
            "Process: Apply online → Inspection → Approval → Installation → Bill submission → Subsidy credit. "
            "IMPORTANT: Always verify current subsidy rates and eligibility at the "
            "District Agriculture Office as scheme details may change."
        ),
        "metadata": {"scheme": "drip_subsidy", "state": "maharashtra"},
        "region": "Maharashtra",
        "language": "en"
    },
]


async def seed_knowledge():
    """Seed all knowledge chunks into the database."""
    await init_db()

    async with async_session_factory() as db:
        # Check current count
        from sqlalchemy import select, func
        from app.models.chat import KnowledgeEmbedding

        count_q = select(func.count(KnowledgeEmbedding.id))
        current_count = (await db.execute(count_q)).scalar() or 0

        if current_count > 0:
            print(f"[INFO] Knowledge base already has {current_count} chunks.")
            response = input("Do you want to add more? (y/n): ").strip().lower()
            if response != "y":
                print("Skipping seeding.")
                return

        print(f"[SEED] Seeding {len(KNOWLEDGE_CHUNKS)} agricultural knowledge chunks...")
        print()

        for i, chunk in enumerate(KNOWLEDGE_CHUNKS, 1):
            try:
                await VectorStoreService.ingest_chunk(
                    source=chunk["source"],
                    title=chunk["title"],
                    content=chunk["content"],
                    metadata=chunk["metadata"],
                    db=db,
                    region=chunk.get("region"),
                    language=chunk.get("language", "en")
                )
                category_prefix = {
                    "crop_manual": "[CROP]",
                    "disease_db": "[DISEASE]",
                    "govt_scheme": "[GOVT]",
                    "best_practice": "[PRACTICE]",
                    "fertilizer_guide": "[FERTILIZER]"
                }
                prefix = category_prefix.get(chunk["source"], "[DOC]")
                safe_title = chunk['title'].encode('ascii', 'ignore').decode('ascii').strip()
                if not safe_title:
                    safe_title = f"multilingual_chunk_{i}"
                print(f"  {prefix} [{i}/{len(KNOWLEDGE_CHUNKS)}] {safe_title}")
            except Exception as e:
                safe_title = chunk['title'].encode('ascii', 'ignore').decode('ascii').strip()
                if not safe_title:
                    safe_title = f"multilingual_chunk_{i}"
                print(f"  [ERROR] [{i}/{len(KNOWLEDGE_CHUNKS)}] FAILED: {safe_title} — {e}")

        print()
        print(f"[SUCCESS] Knowledge seeding complete! {len(KNOWLEDGE_CHUNKS)} chunks ingested.")
        print("   The RAG pipeline will now retrieve relevant chunks for farmer queries.")


if __name__ == "__main__":
    asyncio.run(seed_knowledge())
