#include "board.h"
#include <vector>
Board::Board() {
    Board::reset();
}
void Board::reset() {
    cells.fill('_');
}
bool Board::makeMove(int index, char symbol) {
    if (index < 0 || index >= 9) return false;
    if (cells[index] != '_') return false;

    cells[index] = symbol;
    return true;
}

char Board::getCell(int index) const {
    return cells[index];
}

bool Board::isFull() const {
    for (char c : cells)
        if (c == '_') return false;
    return true;
}

bool Board::hasWinner() const {
    static int wins[8][3] = {
        {0,1,2},{3,4,5},{6,7,8},
        {0,3,6},{1,4,7},{2,5,8},
        {0,4,8},{2,4,6}
    };

    for (auto& w : wins) {
        char a = cells[w[0]];
        if (a != '_' && a == cells[w[1]] && a == cells[w[2]])
            return true;
    }
    return false;
}
void Board::undoMove(int index){
    cells[index]='_';
}
std::vector<int> Board::legalMoves() {
    std::vector<int> moves;
    for(int i=0;i<9;i++){
        if(cells[i]=='_') moves.push_back(i);
    }
    return moves;
}