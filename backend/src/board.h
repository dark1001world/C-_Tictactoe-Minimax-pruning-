#pragma once
#include <array>
#include <vector>
class Board {
public:
    Board();

    bool makeMove(int index, char symbol);
    char getCell(int index) const;
    bool isFull() const;
    bool hasWinner() const;
    void undoMove(int index);
    void reset();
    std::vector<int> legalMoves();
private:
    std::array<char, 9> cells;
};
