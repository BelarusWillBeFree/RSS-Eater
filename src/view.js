import onChange from 'on-change';

const blockInputElements = (state, elements, disabled = false) => {
  const { submitButton, urlInput } = elements;
  if (disabled) {
    submitButton.setAttribute('disabled', 'disabled');
    urlInput.setAttribute('readonly', 'true');
  } else {
    submitButton.removeAttribute('disabled');
    urlInput.removeAttribute('readonly');
  }
};

const showFeedBack = (state, elements) => {
  const feedback = document.querySelector('.feedback');
  const { information } = state.form;
  const [typeMessage] = information.split('.');
  feedback.classList.remove('text-success');
  feedback.classList.remove('text-danger');
  feedback.classList.add(`text-${typeMessage === 'error' ? 'danger' : 'success'}`);
  if (typeMessage === 'error') blockInputElements(state, elements, false);
  feedback.textContent = state.i18n.t(information);
};

const setClassesFromStr = (element, strClass) => {
  strClass.split(' ').forEach((classForAdd) => {
    element.classList.add(classForAdd);
  });
};

const refreshFeeds = (state, elements) => {
  const { feedDiv } = elements;
  const { feeds } = state;
  feedDiv.innerHTML = '';
  const divCard = document.createElement('div');
  setClassesFromStr(divCard, 'card border-0');
  const cardBody = document.createElement('div');
  setClassesFromStr(cardBody, 'card-body');
  const cardTitle = document.createElement('h2');
  setClassesFromStr(cardTitle, 'card-title h4');
  cardTitle.innerText = state.i18n.t('elemets.title_feeds');
  cardBody.append(cardTitle);
  divCard.append(cardBody);
  const ul = document.createElement('ul');
  feeds.forEach((item) => {
    const li = document.createElement('li');
    setClassesFromStr(li, 'list-group-item border-0 border-end-0');
    const h3 = document.createElement('h3');
    setClassesFromStr(h3, 'h6 m-0');
    h3.textContent = item.title;

    li.append(h3);
    const itemDescrip = document.createElement('p');
    setClassesFromStr(itemDescrip, 'm-0 small text-black-50');
    itemDescrip.textContent = item.description;
    li.append(itemDescrip);
    ul.append(li);
  });
  divCard.append(ul);
  feedDiv.append(divCard);
};

const changeColorInLink = (idPost, state) => {
  const needAddIdPost = state.viewedPosts.filter((elem) => elem === idPost).length === 0;
  if (needAddIdPost) {
    const linkChangeColor = document.querySelector(`a[data-post-id="${idPost}"]`);
    linkChangeColor.classList.remove('fw-bold');
    linkChangeColor.classList.add('fw-normal');
  }
};

const addNewLink = (item, state) => {
  const link = document.createElement('a');
  link.setAttribute('href', item.link);
  link.setAttribute('rel', 'noopener noreferrer');
  link.setAttribute('target', '_blank');
  link.setAttribute('data-post-id', item.idPost);
  const linkViewed = state.viewedPosts.filter((elem) => elem === item.idPost).length > 0;
  setClassesFromStr(link, linkViewed ? 'fw-normal' : 'fw-bold');
  link.textContent = item.title;
  return link;
};

const addNewButton = (item, state, elements) => {
  const button = document.createElement('button');
  const { modal } = elements;
  setClassesFromStr(button, 'btn btn-outline-primary btn-sm');
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');
  button.setAttribute('data-post-id', item.idPost);
  button.textContent = 'Просмотр';
  button.addEventListener('click', (objEvent) => {
    const idPost = objEvent.target.getAttribute('data-post-id');
    const [filteredPost] = state.posts.filter((post) => (post.idPost === idPost));
    const title = modal.querySelector('.modal-title');
    title.textContent = filteredPost.title;
    const body = modal.querySelector('.modal-body');
    body.innerHTML = `<p>${filteredPost.description}</p>`;
    const btnRead = modal.querySelector('.full-article');
    btnRead.setAttribute('href', filteredPost.link);
    changeColorInLink(idPost, state);
  });
  return button;
};

const refreshPosts = (state, elements) => {
  const { postsDiv } = elements;
  const { posts } = state;
  postsDiv.innerHTML = '';
  const divCard = document.createElement('div');
  setClassesFromStr(divCard, 'card border-0');

  const cardBody = document.createElement('div');
  setClassesFromStr(cardBody, 'card-body');
  const cardTitle = document.createElement('h2');
  setClassesFromStr(cardTitle, 'card-title h4');
  cardTitle.innerText = state.i18n.t('elemets.title_posts');
  cardBody.append(cardTitle);
  divCard.append(cardBody);
  const ul = document.createElement('ul');
  setClassesFromStr(ul, 'list-group border-0 rounded-0');
  posts.forEach((item) => {
    const li = document.createElement('li');
    setClassesFromStr(li, 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0');

    const link = addNewLink(item, state);
    const button = addNewButton(item, state, elements);
    li.append(link);
    li.append(button);
    ul.append(li);
  });
  divCard.append(ul);
  postsDiv.append(divCard);
};

export default (state) => onChange(state, (path, value) => {
  const elements = {};
  elements.modal = document.getElementById('modal');
  elements.submitButton = document.getElementById('submit');
  elements.urlInput = document.getElementById('url-input');
  elements.postsDiv = document.querySelector('.posts');
  elements.feedDiv = document.querySelector('.feeds');
  switch (path) {
    case 'form.status':
      if (value === 'validation') blockInputElements(state, elements, true);
      break;
    case 'form.information':
      showFeedBack(state, elements);
      break;
    case 'feeds':
      elements.urlInput.value = '';
      elements.urlInput.focus();
      blockInputElements(state, elements, false);
      refreshFeeds(state, elements);
      refreshPosts(state, elements);
      break;
    case 'posts':
      refreshPosts(state, elements);
      break;
    case 'viewedPosts':
      refreshPosts(state, elements);
      break;
    default:
  }
});
