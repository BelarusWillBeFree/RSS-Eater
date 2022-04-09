import onChange from 'on-change';

const showFeedBack = (state) => {
    const feedback = state.view.feedback;
    const { status } = state;
    feedback.classList.remove('text-success');
    feedback.classList.remove('text-danger');
    feedback.classList.add(`text-${status === 'error' ? 'danger' : 'success' }`);
    feedback.textContent = state.i18n.t(state.message.pathI18n);
};

const refreshFeeds = (state) => {
    const { feedDiv } = state.view;
    const { feeds } = state;
    feedDiv.innerHTML = '';
    const divCard = document.createElement('div');
    divCard.classList.add('card');
    divCard.classList.add('border-0');
    divCard.innerHTML = `<div class="card-body"><h2 class="card-title h4">${state.i18n.t('elemets.title_feeds')}</h2></div>`;
    const ul = document.createElement('ul');
    feeds.forEach((item) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.classList.add('border-0');
        li.classList.add('border-end-0');
        li.innerHTML = `<h3 class="h6 m-0">${item.title}</h3> <p class="m-0 small text-black-50">${item.description}</p>`;
        ul.append(li);
    });
    divCard.append(ul);
    feedDiv.append(divCard);
};

const refreshPosts = (state) => {
    const { postsDiv } = state.view;
    const { posts } = state;
    postsDiv.innerHTML = '';
    const divCard = document.createElement('div');
    divCard.classList.add('card');
    divCard.classList.add('border-0');
    divCard.innerHTML = `<div class="card-body"><h2 class="card-title h4">${state.i18n.t('elemets.title_posts')}</h2></div>`;
    const ul = document.createElement('ul');
    ul.classList.add('list-group');
    ul.classList.add('border-0');
    ul.classList.add('rounded-0');
    posts.forEach((item) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.classList.add('d-flex');
        li.classList.add('justify-content-between');
        li.classList.add('align-items-start');
        li.classList.add('border-0');
        li.classList.add('border-end-0');
        li.innerHTML = `<a href="${item.link}" class="fw-bold" data-post-id="0-0" target="_blank" rel="noopener noreferrer">${item.title}</a>`
        + `<button type="button" class="btn btn-outline-primary btn-sm" data-post-id="0-0" data-bs-toggle="modal" data-bs-target="#modal">${state.i18n.t('elemets.button_go')}</button>`;
        ul.append(li);
    });
    divCard.append(ul);
    postsDiv.append(divCard);

};

export default (state) => {
    return onChange(state, (path, value) => {
        switch (path) {
            case 'status': 
                break;
            case 'message.pathI18n':
                showFeedBack(state);
                break;
            case 'feeds':
                state.view.urlInput.value = '';
                state.view.urlInput.focus();
                refreshFeeds(state);
                break;
            case 'posts':
                refreshPosts(state);
                break;
            default:
        }
    });
}