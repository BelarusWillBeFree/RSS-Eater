import onChange from 'on-change';

const blockInputElements = (state, disabled = false) => {
  const buttonSubmit = document.getElementById('submit');
  const urlInput = document.getElementById('url-input');
  if (disabled) {
    buttonSubmit.setAttribute('disabled', 'disabled');
    urlInput.setAttribute('readonly', 'true');
  } else {
    buttonSubmit.removeAttribute('disabled');
    urlInput.removeAttribute('readonly');
  }
};
const showFeedBack = (state) => {
  const feedback = document.querySelector('.feedback');
  const { error } = state.form;
  const [typeMessage] = error.split('.');
  feedback.classList.remove('text-success');
  feedback.classList.remove('text-danger');
  feedback.classList.add(`text-${typeMessage === 'error' ? 'danger' : 'success'}`);
  if (typeMessage === 'error') blockInputElements(state, false);
  feedback.textContent = state.i18n.t(error);
};

const setClassesFromStr = (element, strClass) => {
  strClass.split(' ').forEach((classForAdd) => {
    element.classList.add(classForAdd);
  });
};

const refreshFeeds = (state) => {
  const feedDiv = document.querySelector('.feeds');
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
    state.viewedPosts.push(idPost);
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
  link.addEventListener('click', (objEvent) => {
    const idPost = objEvent.target.getAttribute('data-post-id');
    changeColorInLink(idPost, state);
  });
  return link;
};

const addNewButton = (item, state) => {
  const button = document.createElement('button');
  setClassesFromStr(button, 'btn btn-outline-primary btn-sm');
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');
  button.setAttribute('data-post-id', item.idPost);
  button.textContent = 'Просмотр';
  button.addEventListener('click', (objEvent) => {
    const idPost = objEvent.target.getAttribute('data-post-id');
    const [filteredPost] = state.posts.filter((post) => (post.idPost === idPost));
    const modal = document.getElementById('modal');
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

const refreshPosts = (state) => {
  const postsDiv = document.querySelector('.posts');
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
    const button = addNewButton(item, state);
    li.append(link);
    li.append(button);
    ul.append(li);
  });
  divCard.append(ul);
  postsDiv.append(divCard);
};

export default (state) => onChange(state, (path, value) => {
  const urlInput = document.getElementById('url-input');
  switch (path) {
    case 'form.status':
      if (value === 'validation') blockInputElements(state, true);
      break;
    case 'form.error':
      showFeedBack(state);
      break;
    case 'feeds':
      urlInput.value = '';
      urlInput.focus();
      blockInputElements(state, false);
      refreshFeeds(state);
      refreshPosts(state);
      break;
    case 'posts':
      refreshPosts(state);
      break;
    default:
  }
});
