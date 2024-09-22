from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import os
import requests

app = Flask(__name__)
CORS(app)
CSV_FILE = 'data.csv'

url = "https://proxy.tune.app/chat/completions"

# Ensure the CSV file exists
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['id', 'name', 'value'])  # Header row


@app.route('/data', methods=['GET'])
def read_data():
    data = []
    with open(CSV_FILE, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            data.append(row)
    return jsonify(data)


@app.route('/data', methods=['POST'])
def write_data():
    new_data = request.json
    if not all(k in new_data for k in ('id', 'name', 'value')):
        return jsonify({'error': 'Missing data'}), 400

    with open(CSV_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([new_data['id'], new_data['name'], new_data['value']])

    return jsonify({'message': 'Data added successfully!'}), 201


@app.route('/insight', methods=['GET'])
def insight():
    print("Hi")
    # Read data from CSV
    csvData = []
    with open(CSV_FILE, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            csvData.append(row)

    # Prepare the payload for the API request
    usermessage = "Analyze the following data for physical therapy sessions. Make it sound very scientific yet easy to understand for anyone. Assume they can't see the data. Limit your words in your response to 50. We want a patient's range of motion to increase over time and the effort to decrease over time: " + \
        str(csvData)
    payload = {
        "temperature": 0.8,
        "messages": [
            {
                "role": "user",
                "content": usermessage
            }
        ],
        "model": "meta/llama-3-70b-instruct",
        "stream": False,
        "penalty": 0,
        "max_tokens": 900,
    }

    headers = {
        "X-Org-Id": "9ed6bbe6-22b6-41b8-9f9d-1b3c619ba304",
        "Authorization": "sk-tune-HqqZbG9cRYJCZxwfYvsKCK6NY7BB8t5QuFM",
        "Content-Type": "application/json"
    }

    # Send the request to Tune.ai
    response = requests.request("POST", url=url, json=payload, headers=headers)

    print(response.text)

    return jsonify(response.text)


if __name__ == '__main__':
    app.run(debug=True)
