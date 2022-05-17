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

const createNewFeed = (parsingFeed, watchedState, url) => {
  const newFeed = {
    url,
    id: watchedState.id.feed,
    title: parsingFeed.title,
    description: parsingFeed.description,
  };
  return newFeed;
};

const addOnlyNewPosts = (parsingPosts, watchedState, feed) => {
  const savedPosts = watchedState.posts.filter((elem) => (elem.idFeed === feed.id));
  const postsNeedAdd = _.differenceBy(parsingPosts, savedPosts, 'link');

  postsNeedAdd.forEach((item) => {
    item.idFeed = feed.id;
    item.idPost = `${feed.id}-${watchedState.id.post}`;
    watchedState.id.post += 1;
    watchedState.posts.push(item);
  });
};

const saveFeedAndPosts = (response, watchedState, url) => {
  const { data } = response;

  const { parsingFeed, parsingPosts } = parsingRSS(data, watchedState);
  if (parsingFeed === undefined) return;

  const newFeed = createNewFeed(parsingFeed, watchedState, url);
  watchedState.feeds.push(newFeed);
  watchedState.urlFeeds.push(url);
  watchedState.id.feed += 1;

  addOnlyNewPosts(parsingPosts, watchedState, newFeed);
};

const updatePosts = (response, watchedState, feed) => {
  const { data } = response;

  const { parsingFeed, parsingPosts } = parsingRSS(data, watchedState);
  if (parsingFeed === undefined) return;
  addOnlyNewPosts(parsingPosts, watchedState, feed);
};
const updatePostsByInterval = (watchedState, updateInterval) => {
  const { feeds } = watchedState;
  const arrPromises = feeds.map((feed) => axios(getAllOriginsURL(feed.url))
    .then((promise) => ({
      result: 'succes', value: promise, feed,
    }))
    .catch((error) => ({
      result: 'error', error,
    })));
  const resultPromise = Promise.all(arrPromises);
  resultPromise.then((arrResults) => {
    arrResults.forEach((onePromies) => {
      if (onePromies.result === 'succes') {
        updatePosts(onePromies.value, watchedState, onePromies.feed);
      } else {
        watchedState.status = 'networkError';
        watchedState.view.message = 'error.networkError';
      }
    });
  }).finally(() => {
    setTimeout(updatePostsByInterval, updateInterval, watchedState, updateInterval);
  });
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

const requestByURL = (url, watchedState) => {
  const allOriginsURL = getAllOriginsURL(url);
  axios(allOriginsURL).then((response) => {
    watchedState.status = 'urlAccess';
    watchedState.view.message = 'message.urlAccess';
    saveFeedAndPosts(response, watchedState, url);
  })
    .catch(() => {
      watchedState.status = 'networkError';
      watchedState.view.message = 'error.networkError';
    });
};

const validateError = (e, watchedState) => {
  if (e.type === 'notOneOf') {
    watchedState.status = 'urlAlreadyExist';
    watchedState.view.message = 'error.urlAlreadyExist';
  } else {
    watchedState.status = 'validationError';
    watchedState.view.message = 'error.validationError';
  }
};

const validateUrl = (url, watchedState) => {
  const schemaUrl = yup.string().required().url().trim()
    .notOneOf(watchedState.urlFeeds);
  watchedState.status = 'validation';
  watchedState.view.message = 'message.validation';
  schemaUrl.validate(url)
    .then(() => requestByURL(url, watchedState))
    .catch((e) => validateError(e, watchedState));
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
    status: 'waitEnterURL',
    view: {
      viewedPosts: [],
      message: '',
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
    const url = urlInput.value;
    validateUrl(url, watchedState);
  });
};

export default () => {
  main();
};
