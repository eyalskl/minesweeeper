'use strict';

const EMPTY = '';
const MINE = '💣';
const FLAG = '🚩';
const SMILEY = { normal: '😀', win: '😎', loss: '😭', click: '😮' }
const COLORS = { win: '#3cff39', loss: '#ff3939', playing: '#3978ff' };
const LIFE = '💙';
var gLevel = {
    SIZE: 4,
    MINES: 2,
    LEVEL: 'easy'
};
var gGame;
var gBoard;

function init(SIZE = 4, MINES = 2, LEVEL = 'easy') {
    gLevel = { SIZE, MINES, LEVEL };
    toggleDiffBtns(LEVEL);
    resetGame();
    gBoard = createBoard();
    renderBoard(gBoard);
}

function smileyReset() {
    init(gLevel.SIZE, gLevel.MINES, gLevel.LEVEL)
}

function resetGame() {
    if (gGame?.timerIntervalId) clearInterval(gGame.timerIntervalId)
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lifes: 3,
        isFirstClick: true,
        timerIntervalId: null,
        smileyStatus: SMILEY.normal
    }
    document.querySelector('.smiley-container').classList.remove('game-over');
    document.querySelector('.timer-container span').innerText = 'Start Playing';
    document.querySelector('table').style.outlineColor = COLORS.playing;
    renderLifes();
    setUpSmiley();
}

function renderLifes() {
    var strHTML = '';
    for (var i = 0; i < gGame.lifes; i++) {
        strHTML += `<span> ${LIFE} </span>`;
    }
    if (!strHTML) strHTML = '💀 💀 💀';
    var elLifesContainer = document.querySelector('.lifes-container');
    elLifesContainer.innerHTML = strHTML;
}

function blinkSmiley() {
    setUpSmiley('click');
    setTimeout(setUpSmiley, 50, 'normal');
}

function setUpSmiley(smileyStatus = 'normal') {
    gGame.smileyStatus = SMILEY[smileyStatus];
    var elSmiley = document.querySelector('.smiley-container');
    elSmiley.innerText = gGame.smileyStatus;
}

function toggleDiffBtns(diffLevel) {
    var elDiffBtns = document.querySelectorAll('.levels-container button');
    elDiffBtns.forEach(elDiffBtn => elDiffBtn.classList.remove('active'));
    var elCurrDiffBtn = document.querySelector(`.${diffLevel}`);
    elCurrDiffBtn.classList.add('active');
    if (diffLevel === 'hard') document.querySelector('table').classList.add('shrink-cells');
    else document.querySelector('table').classList.remove('shrink-cells')
}


function startTimer() {
    gGame.timerIntervalId = setInterval(() => {
        gGame.secsPassed++;
        document.querySelector('.timer-container span').innerText = gGame.secsPassed;
    }, 1000);
}

function checkVictory() {
    if (gGame.shownCount === (gLevel.SIZE ** 2 - gLevel.MINES) &&
        gLevel.MINES === gGame.markedCount) {
        return gameOver(true);
    }
}


function createBoard() {
    var board = [];
    for (let i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                isShown: false,
                isMine: false,
                isMarked: false,
                minesAroundCount: 0,
            }
        }
    }
    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            var cellClass = `cell-${i}-${j}`
            var cellContent = EMPTY;
            if (!cell.isShown && !cell.isMarked) cellContent = EMPTY;
            else if (cell.isMarked) {
                cellContent = FLAG;
                cellClass += (gGame.isOn) ? ' flag' : ' flag-right';
            }
            else {
                cellClass += ' shown'
                if (cell.isMine) {
                    cellContent = MINE;
                    if (!gGame.isOn) cellClass += ' bomb'
                }
                else if (cell.minesAroundCount > 0) {
                    cellContent = cell.minesAroundCount;
                    cellClass += ` number${cell.minesAroundCount}`;
                }
            }
            strHTML += `
                <td class="${cellClass}" onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="cellMarked(this, ${i}, ${j}); return false">
                    ${cellContent}
                </td>
            `
        }
        strHTML += '</tr>'
    }
    var elTBody = document.querySelector('.board-container');
    elTBody.innerHTML = strHTML;
}

function checkFirstClick() {
    if (!gGame.isFirstClick) return;
    gGame.isFirstClick = false
    startTimer();
    placeRandMines();
    setMinesNegsCount();
}

function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    checkFirstClick();
    var cell = gBoard[i][j];
    if (cell.isMarked || cell.isShown) return;
    if (cell.isMine) return mineClicked();
    cell.isShown = true;
    gGame.shownCount++;
    if (!cell.minesAroundCount) expandShown(elCell, i, j);
    checkVictory();
    blinkSmiley();
    renderBoard(gBoard)
}

function mineClicked() {
    if (gGame.lifes <= 1) {
        gameOver(false);
        revealAllMines();
    }
    gGame.lifes--;
    renderLifes();
}

function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) cell.isShown = true;
        }
    }
    renderBoard(gBoard);
}

function expandShown(elCell, cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard.length) continue;
            if (i === cellI && j === cellJ) continue;
            cellClicked(elCell, i, j);
        }
    }
}

function cellMarked(elCell, i, j) {
    if (!gGame.isOn) return;
    checkFirstClick();
    var cell = gBoard[i][j];
    if (cell.isShown) return;
    cell.isMarked = !cell.isMarked;
    cell.isMarked ? gGame.markedCount++ : gGame.markedCount--;
    checkVictory();
    renderBoard(gBoard)
}

function setMinesNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) continue;
            cell.minesAroundCount = countMinesAround(i, j, gBoard);
        }
    }
}

function countMinesAround(cellI, cellJ, board) {
    var negsMineCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            if (i === cellI && j === cellJ) continue;
            var cell = board[i][j];
            if (cell.isMine) negsMineCount++;
        }
    }
    return negsMineCount;
}

function gameOver(isWon) {
    gGame.isOn = false;
    document.querySelector('.smiley-container').classList.add('game-over');
    if (gGame.timerIntervalId) clearInterval(gGame.timerIntervalId);
    var winOrLoss = (isWon) ? 'win' : 'loss';
    const { win, loss } = COLORS;
    var tableColor = (isWon) ? win : loss;
    document.querySelector('table').style.outlineColor = tableColor;
    setTimeout(setUpSmiley, 100, winOrLoss);
}

function getEmptyCells(board) {
    var empties = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            if (!cell.isMine) empties.push({ i, j })
        }
    }
    return empties;
}

function placeRandMines() {
    var emptyCells = getEmptyCells(gBoard);
    for (var i = 0; i < gLevel.MINES; i++) {
        var randIdx = getRandIntInclusive(0, emptyCells.length - 1);
        var randPos = emptyCells[randIdx];
        emptyCells.splice(randIdx, 1);
        gBoard[randPos.i][randPos.j].isMine = true;
    }
}

function getRandIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}