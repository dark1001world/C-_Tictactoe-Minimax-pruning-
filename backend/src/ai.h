#pragma once
#include "board.h"

class AI {
public:
    AI(char aiSymbol, char humanSymbol);

    int chooseMove(Board& board);

private:
    char ai;
    char human;

    int minimax(Board& board, bool isMaximizing, int alpha, int beta, int d);
};
