import onChange from 'on-change';

const blockInputElements = (state, disabled = false) => {
  if (disabled) {
    state.view.buttonSubmit.setAttribute('disabled', 'disabled');
    state.view.urlInput.setAttribute('readonly', 'true');
  } else {
    state.view.buttonSubmit.removeAttribute('disabled');
    state.view.urlInput.removeAttribute('readonly');
  }
};
const showFeedBack = (state) => {
  const { feedback } = state.view;
  const { status } = state;
  const [typeStatus] = status.split('.');
  feedback.classList.remove('text-success');
  feedback.classList.remove('text-danger');
  feedback.classList.add(`text-${typeStatus === 'error' ? 'danger' : 'success'}`);
  if (typeStatus === 'error') blockInputElements(state, false);
  feedback.textContent = state.i18n.t(status);
};

const setClassesFromStr = (element, strClass) => {
  strClass.split(' ').forEach((classForAdd) => {
    element.classList.add(classForAdd);
  });
};

const refreshFeeds = (state) => {
  const { feedDiv } = state.view;
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
    console.log( 'item', item, 'title :', item.title);
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
  console.log('check name feed:', state.i18n.t('elemets.title_feeds'));
  console.log(feedDiv.innerHTML);
};

const changeColorInLink = (idPost, state) => {
  const needAddIdPost = state.view.viewedPosts.filter((elem) => elem === idPost).length === 0;
  if (needAddIdPost) {
    state.view.viewedPosts.push(idPost);
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
  const linkViewed = state.view.viewedPosts.filter((elem) => elem === item.idPost).length > 0;
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
    const { modal } = state.view;
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
  const { postsDiv } = state.view;
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
  switch (path) {
    case 'status':
      if (value === 'message.validation') blockInputElements(state, true);
      showFeedBack(state);
      break;
    case 'feeds':
      state.view.urlInput.value = '';
      state.view.urlInput.focus();
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
