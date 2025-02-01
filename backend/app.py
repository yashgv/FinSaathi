from flask import Flask, request, jsonify
from flask_cors import CORS
from scheme_matcher import ImprovedSchemeMatcher
from financial_report import PersonalFinanceAssistant
from werkzeug.middleware.proxy_fix import ProxyFix
from groq import Groq
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
# Configure CORS properly for all routes
# CORS(app, 
#     resources={
#         r"/api/*": {  # Apply to all /api/ routes
#             "origins": ["http://localhost:3000"],  # Add any other allowed origins as needed
#             "methods": ["GET", "POST", "OPTIONS"],
#             "allow_headers": ["Content-Type", "Authorization"],
#             "supports_credentials": True
#         }
#     }
# )

# Use ProxyFix for proper handling of proxy headers
# app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

class FinSaathiAI:
    def __init__(self):
        self.api_key = os.environ.get('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API key must be provided in the GROQ_API_KEY environment variable.")
        self.client = Groq(api_key=self.api_key)
    
    def get_response(self, user_input):
        try:
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": """You are FinSaathi AI, an expert financial advisor specialized in Indian financial markets 
                        and investment options. Provide practical advice considering Indian context, available investment 
                        options, and typical returns in the Indian market. Use INR amounts and Indian financial terms."""
                    },
                    {
                        "role": "user",
                        "content": user_input
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Error getting AI response: {str(e)}")

# Initialize components
try:
    ai_assistant = FinSaathiAI()
    matcher = ImprovedSchemeMatcher()
    matcher.load_schemes("./Government_Schemes-English.pdf")
except Exception as e:
    print(f"Initialization error: {str(e)}")
    ai_assistant = None
    matcher = None

def create_error_response(message, status_code=400):
    return jsonify({
        "status": "error",
        "message": message
    }), status_code

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Server is running",
        "schemes_loaded": len(matcher.schemes) if matcher and hasattr(matcher, 'schemes') else 0
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    if ai_assistant is None:
        return create_error_response("FinSaathi AI is not properly initialized", 500)

    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return create_error_response("No message provided")

        ai_response = ai_assistant.get_response(data['message'])
        current_time = datetime.now().strftime("%I:%M %p")
        
        return jsonify({
            "status": "success",
            "response": {
                "type": "text",
                "content": ai_response,
                "timestamp": current_time,
                "status": True
            }
        })
    except Exception as e:
        return create_error_response(str(e), 500)

@app.route('/api/match-schemes', methods=['POST'])
def match_schemes():
    if matcher is None:
        return create_error_response("Scheme matcher is not properly initialized", 500)

    try:
        data = request.get_json()
        if not data:
            return create_error_response("No data provided")

        # Validate required fields
        required_fields = ["gender", "age", "occupation", "income", "category", "location"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return create_error_response(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Create profile dictionary
        profile = {
            "gender": str(data["gender"]).lower(),
            "age": data["age"],
            "occupation": str(data["occupation"]).lower(),
            "income": float(data["income"]),
            "category": str(data["category"]).lower(),
            "location": str(data["location"]).lower()
        }
        
        matches = matcher.find_matching_schemes(profile, top_k=5)
        
        formatted_matches = [{
            "scheme_code": match["scheme_code"],
            "scheme_name": match["scheme_name"],
            "ministry": match["ministry"],
            "objective": match["objective"],
            "beneficiary": match["beneficiary"],
            "features": match["features"],
            "match_score": float(match["match_score"]),
            "keyword_score": float(match["keyword_score"]),
            "semantic_score": float(match["semantic_score"]),
            "relevance_reasons": match["relevance_reasons"]
        } for match in matches]
        
        return jsonify({
            "status": "success",
            "matches": formatted_matches
        })
    except ValueError as ve:
        return create_error_response(f"Invalid data format: {str(ve)}")
    except Exception as e:
        return create_error_response(str(e), 500)

@app.route('/api/generate-report', methods=['POST'])
def generate_financial_report():
    try:
        data = request.get_json()
        if not data:
            return create_error_response("No data provided")

        assistant = PersonalFinanceAssistant()
        report = assistant.generate_financial_report(
            income=float(data['income']),
            expenses=data['expenses'],
            savings=float(data['savings']),
            goals=data['goals']
        )

        return jsonify({
            "status": "success",
            "report": report
        })
    except ValueError as ve:
        return create_error_response(f"Invalid data format: {str(ve)}")
    except Exception as e:
        return create_error_response(str(e), 500)

@app.errorhandler(404)
def not_found(error):
    return create_error_response("Resource not found", 404)

@app.errorhandler(500)
def server_error(error):
    return create_error_response("Internal server error", 500)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)