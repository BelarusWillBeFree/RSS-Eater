// @ts-check
import * as yup from 'yup';
import getWatcher from './view.js';
import resources from './locales/index.js';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import parsingRSS from './parsingRSS.js';

const urlNotSaved = (watchedState, urlText) => (
  watchedState.feeds.find(feed => feed.url === urlText)
   === undefined
  );

const initI18next = (state) => {
  const defaultLanguage = 'ru';
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources: {
      ru: resources.ru,
    },
  })
  .then(()=>{
    state.i18n = i18nInstance;
    yup.setLocale({
      mixed: {
        default: state.i18n.t('message.validationError'),
      },
    });
  });
}

const getFeedURL = (urlText) => {
  const pathAllOrigins = `https://allorigins.hexlet.app/get`;
  const urlFeed = new URL(pathAllOrigins);
  urlFeed.searchParams.set('url', urlText);
  urlFeed.searchParams.set('disableCache', 'true');
//  urlFeed.searchParams.set('charset', 'utf-8');
  return urlFeed.toString();
}

const processingResponse = (response, watchedState, url, showMessage) => {
  const { contents, status } = response.data;
  if (status.http_code !== 200) {
    watchedState.status = 'error.loadError';
    return;
  }
  if (showMessage)
    watchedState.status = 'message.urlAccess';
  const { parsingFeed, parsingPosts } = parsingRSS(contents);
  let [savedFeed,] = watchedState.feeds.filter(feed => (feed.url === url));
  if (savedFeed === undefined){
    savedFeed = {
      url: watchedState.currentURL,
      id: watchedState.id.feed,
      title: parsingFeed.title,
      description: parsingFeed.description,
    };
    watchedState.feeds.push(savedFeed);
    watchedState.currentURL = undefined;
    watchedState.id.feed =+ 1;
  }

  const postsCurrFeed = watchedState.posts.filter(elem => (elem.idFeed === savedFeed.id));
  const postsNeedAdd = _.differenceBy(parsingPosts, postsCurrFeed, 'link');

  postsNeedAdd.forEach(item => {
    item.idFeed = savedFeed.id;
    const idPost = `${savedFeed.id}-${watchedState.id.post ++}`;
    item.idPost = idPost;
    watchedState.posts.push(item);
  });
}

const loadByURL = (url, watchedState, showMessage = true) => {
  const allOriginsPath = getFeedURL(url);
  console.log(allOriginsPath);
  axios(allOriginsPath).then((response)=> {
    console.log('response ',response);
    processingResponse(response, watchedState, url, showMessage);
  })
  .catch(function (err) {
    console.log('network error ',err);
    watchedState.status = 'error.networkError';
  });
}

const updatePostsByInterval = (watchedState, updateInterval) => {
  const { feeds } = watchedState;
  feeds.forEach((feed) => {
    loadByURL(feed.url, watchedState, false);
  });
  setTimeout(updatePostsByInterval, updateInterval, watchedState, updateInterval);
}

const initViewElements = (watchedState) => {
  watchedState.view.form = document.querySelector('form[name="form-search"]');
  watchedState.view.feedback = document.querySelector('.feedback');
  watchedState.view.feedDiv = document.querySelector('.feeds');
  watchedState.view.postsDiv = document.querySelector('.posts');
  watchedState.view.modal = document.getElementById('modal');
  watchedState.view.buttonSubmit = document.getElementById('submit');
  watchedState.view.urlInput = document.getElementById('url-input');
}

const eventSubmit = (watchedState) => {
  const schemaUrl = yup.string().required().url().trim();
  const urlInput = document.getElementById('url-input');
  const urlPath = urlInput.value;
  console.log(urlPath);
  watchedState.status = 'message.validation';
  schemaUrl.validate(urlPath)
  .then(() => {
    if (urlNotSaved(watchedState, urlPath)) {
      watchedState.currentURL = urlPath;
      loadByURL(urlPath, watchedState);
    } else {
      watchedState.status = 'error.urlAlreadyExist';
    }
  })
  .catch(() => {
    watchedState.status = 'error.validationError';
  });

}

const main = () => {
  const updateInterval = 5000;
  const state = {
    feeds: [],
    posts: [],
    id: {
      feed: 0,
      post: 0,
    },
    currentURL: undefined,
    status: 'waitEnterURL',
    view: {
      viewedPosts: [],
    },
  };
  initI18next(state);
  const watchedState = getWatcher(state);
  initViewElements(watchedState);
  const form = document.querySelector('form[name="form-search"]');
  setTimeout(updatePostsByInterval, 0, watchedState, updateInterval);
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    eventSubmit(watchedState);
  });
}

export default () => {
  main();
}