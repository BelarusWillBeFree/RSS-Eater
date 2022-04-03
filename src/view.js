import onChange from 'on-change';

const buildErrorElement = (state) => {
    const invalidFeedback = document.querySelector('.invalid-feedback');
    const el = invalidFeedback ?? document.createElement('div');
    el.classList.add('invalid-feedback');
    el.textContent = state.i18n.t(state.errors);//state.error;
    state.view.urlInput.parentNode.append(el);
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
        const { urlInput } = state.view;
        urlInput.focus();
        urlInput.classList.remove('border-3');
        urlInput.classList.remove('border-danger');
        urlInput.classList.remove('is-invalid');
        switch (path) {
            case 'status': 
                switch (value) {
                    case 'errorValidation':
                        urlInput.classList.add('border-3');
                        urlInput.classList.add('border-danger');
                        urlInput.classList.add('is-invalid');
                        buildErrorElement(state);
                        break;
                    case 'refreshFeed':
                        urlInput.value = '';
                        refreshFeeds(state);
                        break;
                    }
                break;
            default:
        }
    });
}