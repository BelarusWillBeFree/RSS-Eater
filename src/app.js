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
    id: watchedState.nextIdFeed,
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
    item.idPost = `${feed.id}-${watchedState.nextIdPost}`;
    watchedState.nextIdPost += 1;
    watchedState.posts.push(item);
  });
};

const saveFeedAndPosts = (response, watchedState, url) => {
  const { data } = response;

  const { parsingFeed, parsingPosts } = parsingRSS(data, watchedState);

  const newFeed = createNewFeed(parsingFeed, watchedState, url);
  watchedState.feeds.push(newFeed);
  watchedState.urlFeeds.push(url);
  watchedState.nextIdFeed += 1;

  addOnlyNewPosts(parsingPosts, watchedState, newFeed);
};

const updatePosts = (response, watchedState, feed) => {
  const { data } = response;

  const { parsingPosts } = parsingRSS(data, watchedState);
  addOnlyNewPosts(parsingPosts, watchedState, feed);
};

const getFeedPromise = (watchedState, feed) => (
  axios(getAllOriginsURL(feed.url))
    .then((promise) => updatePosts(promise, watchedState, feed))
    .catch(() => {
      watchedState.status = 'networkError';
      watchedState.view.message = 'error.networkError';
    })
);

const updatePostsByInterval = (watchedState, updateInterval) => {
  const { feeds } = watchedState;
  const feedsPromises = feeds.map((feed) => getFeedPromise(watchedState, feed));

  const resultPromise = Promise.all(feedsPromises);

  resultPromise.finally(() => {
    setTimeout(updatePostsByInterval, updateInterval, watchedState, updateInterval);
  });
};

const requestByURL = (url, watchedState) => {
  const allOriginsURL = getAllOriginsURL(url);
  axios(allOriginsURL).then((response) => {
    watchedState.form.status = 'uploadedSuccessfully';
    watchedState.form.error = 'message.uploadedSuccessfully';
    saveFeedAndPosts(response, watchedState, url);
  })
    .catch(() => {
      watchedState.form.status = 'networkError';
      watchedState.form.error = 'error.networkError';
    });
};

const validateError = (e, watchedState) => {
  if (e.type === 'notOneOf') {
    watchedState.form.status = 'urlAlreadyExist';
    watchedState.form.error = 'error.urlAlreadyExist';
  } else {
    watchedState.form.status = 'validationError';
    watchedState.form.error = 'error.validationError';
  }
};

const validateUrl = (url, watchedState) => {
  const schemaUrl = yup.string().required().url().trim()
    .notOneOf(watchedState.urlFeeds);
  watchedState.form.status = 'validation';
  watchedState.form.error = 'message.validation';
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
    nextIdFeed: 0,
    nextIdPost: 0,
    form: {
      status: 'waitEnterURL',
      error: '',
    },
    viewedPosts: [],
  };
  initI18next(state);
  const watchedState = getWatcher(state);
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
