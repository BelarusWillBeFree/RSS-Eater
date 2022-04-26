// @ts-check
import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import getWatcher from './view.js';
import resources from './locales/index.js';
import parsingRSS from './parsingRSS.js';

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
    .then(() => {
      state.i18n = i18nInstance;
      yup.setLocale({
        mixed: {
          default: state.i18n.t('message.validationError'),
        },
      });
    });
};

const getAllOriginsURL = (urlText) => {
  const pathAllOrigins = 'https://allorigins.hexlet.app/get';
  const urlFeed = new URL(pathAllOrigins);
  urlFeed.searchParams.set('url', urlText);
  urlFeed.searchParams.set('disableCache', 'true');
  return urlFeed.toString();
};

const processingResponse = (response, watchedState, url, showMessage) => {
  const { data } = response;

  const { parsingFeed, parsingPosts } = parsingRSS(data, watchedState);
  if (showMessage) {
    watchedState.status = 'message.urlAccess';
  }
  let [savedFeed] = watchedState.feeds.filter((feed) => (feed.url === url));
  if (savedFeed === undefined) {
    savedFeed = {
      url: getAllOriginsURL(watchedState.currentURL),
      id: watchedState.id.feed,
      title: parsingFeed.title,
      description: parsingFeed.description,
    };
    watchedState.feeds.push(savedFeed);
    watchedState.urlFeeds.push(watchedState.currentURL);
    watchedState.currentURL = undefined;
    watchedState.id.feed += 1;
  }

  const postsCurrFeed = watchedState.posts.filter((elem) => (elem.idFeed === savedFeed.id));
  const postsNeedAdd = _.differenceBy(parsingPosts, postsCurrFeed, 'link');

  postsNeedAdd.forEach((item) => {
    item.idFeed = savedFeed.id;
    const idPost = `${savedFeed.id}-${watchedState.id.post}`;
    watchedState.id.post += 1;
    item.idPost = idPost;
    watchedState.posts.push(item);
  });
};

const loadByURL = (watchedState, showMessage = true) => {
  const url = watchedState.currentURL;
  axios(getAllOriginsURL(watchedState.currentURL)).then((response) => {
    processingResponse(response, watchedState, url, showMessage);
  })
    .catch(() => {
      watchedState.status = 'error.networkError';
    });
};

const updatePostsByInterval = (watchedState, updateInterval) => {
  const { feeds } = watchedState;
  const arrPromises = feeds.map((feed) => axios(feed.url)
    .then((promise) => ({
      result: 'succes', value: promise,
    }))
    .catch((error) => ({
      result: 'error', error,
    })));
  const resultPromise = Promise.all(arrPromises);
  resultPromise.then((arrResults) => {
    arrResults.forEach((onePromies) => {
      if (onePromies.result === 'succes') {
        processingResponse(onePromies.value, watchedState, onePromies.value.config.url, false);
      } else {
        watchedState.status = 'error.networkError';
      }
    });
  });
  setTimeout(updatePostsByInterval, updateInterval, watchedState, updateInterval);
};

const initViewElements = (watchedState) => {
  watchedState.view.form = document.querySelector('form[name="form-search"]');
  watchedState.view.feedback = document.querySelector('.feedback');
  watchedState.view.feedDiv = document.querySelector('.feeds');
  watchedState.view.postsDiv = document.querySelector('.posts');
  watchedState.view.modal = document.getElementById('modal');
  watchedState.view.buttonSubmit = document.getElementById('submit');
  watchedState.view.urlInput = document.getElementById('url-input');
};

const addNewFeed = (watchedState) => {
  const schemaUrl = yup.string().required().url().trim()
    .notOneOf(watchedState.urlFeeds);
  const urlPath = watchedState.currentURL;
  watchedState.status = 'message.validation';
  schemaUrl.validate(urlPath)
    .then(() => {
      loadByURL(watchedState);
    })
    .catch((e) => {
      const { message } = e;
      const textErr = 'this must not be one of the following values';
      if (message.search(textErr) !== -1) {
        watchedState.status = 'error.urlAlreadyExist';
      } else {
        watchedState.status = 'error.validationError';
      }
    });
};

const main = () => {
  const updateInterval = 5000;
  const state = {
    feeds: [],
    urlFeeds: [],
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
  updatePostsByInterval(watchedState, updateInterval);
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const urlInput = document.getElementById('url-input');
    watchedState.currentURL = urlInput.value;
    addNewFeed(watchedState);
  });
};

export default () => {
  main();
};
