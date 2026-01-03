#include "board.h"
#include "ai.h"
#include <iostream>
#include <string>
#include <sstream>

using namespace std;

// Simple JSON parser for our use case
string readInput() {
    string line, input;
    while (getline(cin, line)) {
        input += line;
    }
    return input;
}

string extractValue(const string& json, const string& key) {
    size_t pos = json.find("\"" + key + "\"");
    if (pos == string::npos) return "";
    
    pos = json.find(":", pos);
    pos = json.find("\"", pos);
    size_t end = json.find("\"", pos + 1);
    
    return json.substr(pos + 1, end - pos - 1);
}

vector<string> extractArray(const string& json, const string& key) {
    vector<string> result;
    size_t pos = json.find("\"" + key + "\"");
    if (pos == string::npos) return result;
    
    pos = json.find("[", pos);
    size_t end = json.find("]", pos);
    string arrayContent = json.substr(pos + 1, end - pos - 1);
    
    stringstream ss(arrayContent);
    string item;
    while (getline(ss, item, ',')) {
        size_t start = item.find("\"");
        size_t finish = item.rfind("\"");
        if (start != string::npos && finish != string::npos) {
            result.push_back(item.substr(start + 1, finish - start - 1));
        }
    }
    
    return result;
}

int main() {
    string input = readInput();
    
    vector<string> boardState = extractArray(input, "board");
    string aiSymbol = extractValue(input, "aiSymbol");
    string humanSymbol = extractValue(input, "humanSymbol");
    Board board;
    for (int i = 0; i < 9; i++) {
        if (boardState[i] != "_") {
            board.makeMove(i, boardState[i][0]);
        }
    }
    
    AI ai(aiSymbol[0], humanSymbol[0]);
    int move = ai.chooseMove(board);
    
    board.makeMove(move, aiSymbol[0]);
    
    bool hasWinner = board.hasWinner();
    bool isFull = board.isFull();
    string winner = "null";
    if (hasWinner) {
        winner = "\"" + string(1, board.getCell(move)) + "\"";
    }
    
    cout << "{";
    cout << "\"move\":" << move << ",";
    cout << "\"board\":[";
    for (int i = 0; i < 9; i++) {
        char cell = board.getCell(i);
        cout << "\"" << cell << "\"";
        if (i < 8) cout << ",";
    }
    cout << "],";
    cout << "\"hasWinner\":" << (hasWinner ? "true" : "false") << ",";
    cout << "\"isFull\":" << (isFull ? "true" : "false") << ",";
    cout << "\"winner\":" << winner;
    cout << "}" << endl;
    
    return 0;
}