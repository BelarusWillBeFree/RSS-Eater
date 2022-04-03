import onChange from 'on-change';

const showFeedBack = (state) => {
    const feedback = state.view.feedback;
    const { status } = state;
    feedback.classList.remove('text-success');
    feedback.classList.remove('text-danger');
    feedback.classList.add(`text-${status === 'validationError' ? 'danger' : 'success' }`);
    feedback.textContent = state.i18n.t(state.message.pathI18n);
};

const refreshFeeds = (state) => {
    const { feeds } = state.view;
    const { listOfUrl } = state;
    feeds.innerHTML = '';
    const divCard = document.createElement('div');
    divCard.classList.add('card');
    divCard.classList.add('border-0');
    divCard.innerHTML = '<div class="card-body"><h2 class="card-title h4">Фиды</h2></div>';
    const ul = document.createElement('ul');
    listOfUrl.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.append(li);
    });
    divCard.append(ul);
    feeds.append(divCard);
};

export default (state) => {
    return onChange(state, (path, value) => {
        switch (path) {
            case 'status': 
                switch (value) {
                    case 'refreshFeed':
                        state.view.urlInput.value = '';
                        state.view.urlInput.focus();
                        refreshFeeds(state);
                        break;
                    }
                break;
            case 'message.pathI18n':
                showFeedBack(state);
                break;
            default:
        }
    });
}