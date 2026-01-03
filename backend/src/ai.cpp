#include "ai.h"
#include <limits>

using std::numeric_limits;

AI::AI(char aiSymbol, char humanSymbol)
    : ai(aiSymbol), human(humanSymbol) {}
int AI::chooseMove(Board& board) {
    int bestMove = -1;
    int bestScore = numeric_limits<int>::min();

    for (int move : board.legalMoves()) {
        board.makeMove(move, ai);
        int score = minimax(board, false,std::numeric_limits<int>::min(),
            std::numeric_limits<int>::max(),0);
        board.undoMove(move);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}
int AI::minimax(Board& board, bool isMaximizing,int alpha, int beta, int d) {
    if (board.hasWinner()) {
        return isMaximizing ? -100+d : 100-d;
    }

    if (board.isFull()) {
        return 0;
    }

    if (isMaximizing) {
        int best = numeric_limits<int>::min();

        for (int move : board.legalMoves()) {
            board.makeMove(move, ai);
            best = std::max(best, minimax(board, false,alpha, beta,d+1));
            board.undoMove(move);
            alpha=std::max(alpha,best);
            if(alpha>=beta) break;
        }

        return best;
    } else {
        int best = numeric_limits<int>::max();

        for (int move : board.legalMoves()) {
            board.makeMove(move, human);
            best = std::min(best, minimax(board, true,alpha,beta,d+1));
            board.undoMove(move);
            beta=std::min(beta,best);
            if(alpha>=beta) break;
        }

        return best;
    }
}
