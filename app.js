const qSel = (e) => document.querySelector(e);

async function generateDeck() {
    let response = await fetch(
        'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6'
    ).then((res) => res.json());
    return response.deck_id;
}

async function getCard() {
    if (!deckId) return null;

    let response = await fetch(
        `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1}`,
        { method: 'POST' }
    ).then((res) => res.json());

    let element = document.createElement('div');
    element.classList.add('card');
    let image = response.cards[0].image;
    element.style.backgroundImage = `url(${image})`;
    element.info = response.cards[0];
    return element;
}

function getValue(name) {
    if (Number(name) == name) return Number(name);
    if (name != 'ACE') return 10;
    return 11;
}

function calculateScore(hand) {
    let totalScore = 0;
    hand.filter((card) => card.info.value !== 'ACE').forEach(
        (card) => (totalScore += getValue(card.info.value))
    );
    let aces = hand.filter((card) => card.info.value === 'ACE');
    for (let i = 0; i < aces.length; ++i)
        if (i != aces.length - 1) totalScore += 1;
        else if (totalScore + 11 <= 21) totalScore += 11;
        else totalScore += 1;
    return totalScore;
}

function end(status) {
    qSel('#status').innerText = status;
    ended = true;
    let score = localStorage.getItem('score');
    if (!score) score = '0:0';
    if (status === 'WIN')
        score = Number(score.split(':')[0]) + 1 + ':' + score.split(':')[1];
    if (status === 'LOSE')
        score = score.split(':')[0] + ':' + (Number(score.split(':')[1]) + 1);
    localStorage.setItem('score', score);
    qSel('#score').innerText = score;
    qSel('#hit').style.display = 'none';
    qSel('#stand').onclick = () => {
        window.location.reload();
    };
    qSel('#stand').innerText = 'refresh';
    qSel('#stand').disabled = false;
}

let deckId = null;
let playerHand = [];
let dealerHand = [];
let ended = false;

const updatePlayerScore = () => {
    qSel('#playerScore').innerText = calculateScore(playerHand);
};

const updateDealerScore = () => {
    qSel('#dealerScore').innerText = calculateScore(dealerHand);
};

qSel('#hit').onclick = async () => {
    let card = await getCard();
    qSel('#player').append(card);
    playerHand.forEach((e) => {
        e.style.zIndex = 2;
        e.animate(
            [{ transform: 'translateX(50%)' }, { transform: 'translateX(0)' }],
            {
                duration: 250,
                direction: 'alternate',
                easing: 'ease-out',
            }
        );
    });
    card.animate(
        [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }],
        {
            duration: 250,
            direction: 'alternate',
            easing: 'ease-out',
        }
    );
    playerHand.push(card);
    updatePlayerScore();

    if (calculateScore(playerHand) === 21) end('WIN');
    if (calculateScore(playerHand) > 21) end('LOSE');
};

qSel('#stand').onclick = async () => {
    qSel('#hit').disabled = true;
    qSel('#stand').disabled = true;
    dealerHand[0].style.zIndex = 2;
    let card = await getCard();
    qSel('.placeholder').animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }],
        {
            duration: 250,
            direction: 'alternate',
            easing: 'ease-out',
        }
    );
    await new Promise((r) => setTimeout(r, 250));
    qSel('#dealer').removeChild(qSel('.placeholder'));
    qSel('#dealer').append(card);
    dealerHand.push(card);
    card.animate(
        [{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }],
        {
            duration: 250,
            direction: 'alternate',
            easing: 'ease-out',
        }
    );
    updateDealerScore();

    let playerScore = calculateScore(playerHand);
    let dealerScore = calculateScore(dealerHand);

    while (dealerScore < playerScore || dealerScore <= 11) {
        await new Promise((r) => setTimeout(r, 750));
        card = await getCard();
        qSel('#dealer').append(card);
        dealerHand.forEach((e) => {
            e.style.zIndex = 2;
            e.animate(
                [
                    { transform: 'translateX(50%)' },
                    { transform: 'translateX(0)' },
                ],
                {
                    duration: 500,
                    direction: 'alternate',
                    easing: 'ease-out',
                }
            );
        });
        card.animate(
            [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }],
            {
                duration: 500,
                direction: 'alternate',
                easing: 'ease-out',
            }
        );
        dealerHand.push(card);
        updateDealerScore();
        dealerScore = calculateScore(dealerHand);
    }
    if (dealerScore === playerScore) end('DRAW');
    else if (dealerScore > 21) end('WIN');
    else if (dealerScore === 21 || dealerScore > playerScore) end('LOSE');
};

document.addEventListener('keyup', (e) => {
    if (e.key == 'ArrowLeft') qSel('#hit').focus();
    if (e.key == 'ArrowRight') qSel('#stand').focus();
    if ([' ', 'Enter'].indexOf(e.key) !== -1) {
        if (!ended) return;
        e.preventDefault();
        document.location.reload();
        return;
    }
});

(async () => {
    let score = localStorage.getItem('score');
    if (!score) score = '0:0';
    qSel('#score').innerText = score;

    deckId = await generateDeck();

    let card = await getCard();
    qSel('#dealer').append(card);
    dealerHand.push(card);
    updateDealerScore();
    let placeholder = document.createElement('div');
    placeholder.classList.add('card', 'placeholder');
    qSel('#dealer').append(placeholder);

    for (let i = 0; i < 2; ++i) {
        card = await getCard();
        qSel('#player').append(card);
        playerHand.push(card);
    }
    updatePlayerScore();
    if (calculateScore(playerHand) === 21) end('NOPE');
})();
