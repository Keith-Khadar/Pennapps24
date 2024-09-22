#include <iostream>
#include <sstream>
#include <fstream>
#include <string>
#include <vector>
#include <curl/curl.h> // For API requests
#include "json.hpp" // Include nlohmann/json library

using json = nlohmann::json;

// Callback function to capture API response
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* output) {
    size_t totalSize = size * nmemb;
    output->append((char*)contents, totalSize);
    return totalSize;
}

std::string sendToTuneAI(const std::string& userMessage, const std::string& model, const std::string& apiKey) {
    CURL *curl;
    CURLcode res;
    std::string readBuffer;

    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl = curl_easy_init();

    if (curl) {
        std::string apiUrl = "https://proxy.tune.app/chat/completions";

        json payload = {
            {"temperature", 0.8},
            {"messages", json::array({
                {{"role", "user"}, {"content", userMessage}}
            })},
            {"model", model},
            {"stream", false},
            {"penalty", 0},
            {"max_tokens", 900}
        };

        std::string payloadStr = payload.dump();
        
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, ("Authorization: " + apiKey).c_str());
        headers = curl_slist_append(headers, "Content-Type: application/json");

        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_URL, apiUrl.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payloadStr.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, payloadStr.length());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

        // Add these lines for verbose output
        curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);
        curl_easy_setopt(curl, CURLOPT_STDERR, stdout);

        res = curl_easy_perform(curl);

        if (res != CURLE_OK) {
            std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;
        }

        long response_code;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &response_code);
        //std::cout << "HTTP Response Code: " << response_code << std::endl;

        curl_easy_cleanup(curl);
        curl_slist_free_all(headers);
    }

    curl_global_cleanup();

    return readBuffer;
}
std::string readCSV(const std::string& filename) {
    std::ifstream file(filename);
    std::string line;
    std::stringstream csvData;

    if (file.is_open()) {
        while (std::getline(file, line)) {
            csvData << line << "\n"; // Append each line of CSV data
        }
        file.close();
    } else {
        std::cerr << "Could not open the file: " << filename << std::endl;
    }

    return csvData.str();
}
int main() {
    std::string apiKey = "sk-tune-HqqZbG9cRYJCZxwfYvsKCK6NY7BB8t5QuFM"; // Replace with your actual API key
    std::string csvData = readCSV("data.csv");
    std::string userMessage = "Analyze the following data for physical therapy sessions. Make its sound very scientific yet easy to understand for anyone. Assume they cant see the data. Limit your words in your response to 50. We want a patients range of motion to increase over time and the effort to decrease over time: " + csvData;
    std::string model = "meta/llama-3-70b-instruct";

    //std::cout << "User Message: " << userMessage << std::endl;

    std::string response = sendToTuneAI(userMessage, model, apiKey);

    std::cout << "Raw API Response:" << std::endl;
    std::cout << response << std::endl;

    try {
        json responseJson = json::parse(response);
        std::cout << "Parsed JSON Response:" << std::endl;
        std::cout << responseJson.dump(2) << std::endl; // Pretty print JSON

        if (responseJson.contains("choices") && responseJson["choices"].is_array() && !responseJson["choices"].empty()) {
            std::string generatedContent = responseJson["choices"][0]["message"]["content"];
            std::cout << "Generated Response: " << generatedContent << std::endl;
        } else {
            std::cerr << "Unexpected response format" << std::endl;
        }
    } catch (json::parse_error& e) {
        std::cerr << "JSON parsing error: " << e.what() << std::endl;
    }

    return 0;
}