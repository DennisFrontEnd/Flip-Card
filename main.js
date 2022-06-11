//遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

//卡片花色
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

const view = {
  //取得卡背元素
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
  },
  //取得卡片點數和花色
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const Symbol = Symbols[Math.floor(index / 13)];
    return `
      <p>${number}</p>
      <img src="${Symbol}">
      <p>${number}</p>
    `
  },
  displayCards(indexes) {
    const rootElement = document.querySelector("#cards");
    //.join()會將陣列內的元素串接起來，變成一個字串，就跟寫html結構一樣
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('');
  },
  flipCards(...cards) {
    //如果是背面回傳正面
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      //如果是正面回傳背面
      card.classList.add('back')
      //清空牌面的卡片點數和花色
      card.innerHTML = null;
    })
  },
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`
  },
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`
  },
  transformNumber(number) {
    switch (number) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K"
      default:
        return number;
    }
  },
  //區別配對成功的卡片
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add("paired")
    })
  },
  failPair(...cards) {
    cards.map(card => {
      card.classList.add("wrong")
      card.addEventListener("animationend", e => {
        card.classList.remove('wrong')
      }, {
        once: true
      })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

// 洗牌
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys());
    for (let index = number.length - 1; index > 1; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number;
  }
}

const controller = {
  //指定初始狀態
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  //依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    if (!card.classList.contains("back")) {
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        //break 之後還是會執行後面的程式碼
        break

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)

        // 配對成功，卡片停留在場上並變色   
        if (model.isRevealedCardsMatched()) {
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          if (model.score === 260) {
            view.showGameFinished()
          }
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          //配對失敗，翻回卡背
          this.currentState = GAME_STATE.CardsMatchFailed
          view.failPair(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

//資料管理，分數、翻牌次數等等，在這個專案最重要就是要存放翻開來的那兩張牌
const model = {
  //存放翻開的兩張卡是否有配對成功，失敗則清空陣列
  revealedCards: [],

  score: 0,
  triedTimes: 0,

  isRevealedCardsMatched() {
    //ex: 10 % 13 = 10; 23 % 13 = 10;
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  }

}

controller.generateCards();


document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card);
  })
})

