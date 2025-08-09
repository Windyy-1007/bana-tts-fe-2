from flask import Flask, make_response, request, jsonify
import requests
import base64
from flask_cors import CORS

app = Flask(__name__, static_folder="front-end", static_url_path="")
CORS(app)

# API Configuration
BAHNAR_API_URL = "https://www.ura.hcmut.edu.vn/bahnar/nmt/api/"

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.get_json()
        input_text = data.get("text", "")
        gender = data.get("gender", data.get("voice", "male"))  # Support both 'gender' and 'voice' parameters
        region = data.get("region", "gialai")
        
        print(f"Received request: text='{input_text[:50]}...', gender='{gender}', region='{region}'")
        
        if not input_text:
            return jsonify({"error": "Text is required"}), 400

        # Call the Bahnar API
        print(f"Calling Bahnar API: {BAHNAR_API_URL}translateBahnar/voice")
        api_response = requests.post(
            f"{BAHNAR_API_URL}translateBahnar/voice",
            json={
                "text": input_text,
                "gender": gender,
                "region": region
            },
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"API response status: {api_response.status_code}")
        print(f"API response headers: {dict(api_response.headers)}")
        
        if api_response.status_code == 200:
            api_data = api_response.json()
            print(f"API response data keys: {api_data.keys() if api_data else 'None'}")
            
            # Check if the API call was successful
            if api_data.get("success") and api_data.get("code") == 200:
                # Parse the payload to get the audio URL
                import json
                payload = json.loads(api_data.get("payload", "{}"))
                urls = payload.get("urls", [])
                
                print(f"Found {len(urls)} audio URLs: {urls}")
                
                if urls and len(urls) > 0:
                    audio_url = urls[0]
                    print(f"Downloading audio from: {audio_url}")
                    
                    # Try to download the audio file with retries
                    # The audio file might need time to be generated
                    # Check every 1 second for up to 30 seconds
                    max_wait_time = 30  # seconds
                    retry_interval = 1  # seconds
                    max_retries = max_wait_time // retry_interval
                    
                    import time
                    
                    for attempt in range(max_retries):
                        audio_response = requests.get(audio_url, timeout=10)
                        
                        if audio_response.status_code == 200:
                            # Convert audio to base64
                            audio_data = base64.b64encode(audio_response.content).decode('utf-8')
                            print(f"Successfully converted audio to base64 after {attempt + 1} attempts, length: {len(audio_data)}")
                            return jsonify({"speech": audio_data})
                        elif audio_response.status_code == 404 and attempt < max_retries - 1:
                            # Audio not ready yet, wait 1 second and retry
                            print(f"Audio not ready yet (attempt {attempt + 1}/{max_retries}), waiting {retry_interval} second...")
                            time.sleep(retry_interval)
                        else:
                            # Either not a 404 or we've exhausted retries
                            print(f"Failed to download audio after {attempt + 1} attempts: {audio_response.status_code}")
                            if audio_response.status_code == 404:
                                return jsonify({"error": f"Audio file not available after {max_wait_time} seconds"}), 500
                            else:
                                return jsonify({"error": f"Failed to download audio file: {audio_response.status_code}"}), 500
                    
                    # If we get here, all retries failed with 404
                    return jsonify({"error": f"Audio file not available after {max_wait_time} seconds"}), 500
                else:
                    print("No audio URLs in response")
                    return jsonify({"error": "No audio URLs returned from API"}), 500
            else:
                print(f"API returned error: success={api_data.get('success')}, code={api_data.get('code')}, message={api_data.get('message')}")
                return jsonify({"error": f"API error: {api_data.get('message', 'Unknown error')}"}), 500
        else:
            print(f"API request failed with status {api_response.status_code}")
            try:
                error_data = api_response.json()
                print(f"API error response: {error_data}")
            except:
                print(f"API error response (raw): {api_response.text[:200]}...")
            return jsonify({"error": f"API request failed with status {api_response.status_code}"}), 500
            
    except requests.exceptions.RequestException as e:
        print(f"Request exception: {str(e)}")
        return jsonify({"error": f"API request failed: {str(e)}"}), 500
    except Exception as e:
        print(f"General exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/")
def root():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    import os
    # Allow port to be configured via environment variable (useful for some platforms)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)