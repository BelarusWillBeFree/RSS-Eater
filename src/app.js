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

const addOnlyNewPosts = (parsingPosts, watchedState, feed) => {
  const savedPosts = watchedState.posts.filter((elem) => (elem.idFeed === feed.id));
  const postsNeedAdd = _.differenceBy(parsingPosts, savedPosts, 'link');

  postsNeedAdd.forEach((item) => {
    item.idFeed = feed.id;
    item.idPost = `${feed.id}-${_.uniqueId()}`;
    watchedState.posts.push(item);
  });
};

const updateFeeds = (watchedState, updateInterval) => {
  const { feeds } = watchedState;
  const feedsPromises = feeds.map((feed) => (
    axios(getAllOriginsURL(feed.url))
      .then((promise) => {
        const { data } = promise;
        try {
          const { parsingPosts } = parsingRSS(data, watchedState);
          addOnlyNewPosts(parsingPosts, watchedState, feed);
        } catch {
          watchedState.form.status = 'parsingError';
          watchedState.form.error = 'error.parsingError';
        }
      })
      .catch(() => {
        watchedState.status = 'networkError';
        watchedState.view.message = 'error.networkError';
      })
  ));

  const resultPromise = Promise.all(feedsPromises);

  resultPromise.finally(() => {
    setTimeout(updateFeeds, updateInterval, watchedState, updateInterval);
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

const loadFeed = (url, watchedState) => {
  const schemaUrl = yup.string().required().url().trim()
    .notOneOf(watchedState.urlFeeds);
  watchedState.form.status = 'validation';
  watchedState.form.error = 'message.validation';
  schemaUrl.validate(url)
    .then(() => {
      const allOriginsURL = getAllOriginsURL(url);
      axios(allOriginsURL).then((response) => {
        watchedState.form.status = 'uploadedSuccessfully';
        watchedState.form.error = 'message.uploadedSuccessfully';
        const { data } = response;
        try {
          const { parsingFeed, parsingPosts } = parsingRSS(data, watchedState);
          const newFeed = {
            url,
            id: _.uniqueId(),
            title: parsingFeed.title,
            description: parsingFeed.description,
          };
          watchedState.feeds.push(newFeed);
          watchedState.urlFeeds.push(url);
          addOnlyNewPosts(parsingPosts, watchedState, newFeed);
        } catch {
          watchedState.form.status = 'parsingError';
          watchedState.form.error = 'error.parsingError';
        }
      })
        .catch(() => {
          watchedState.form.status = 'networkError';
          watchedState.form.error = 'error.networkError';
        });
    })
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
    elements: {},
    viewedPosts: [],
  };
  initI18next(state);
  const watchedState = getWatcher(state);
  const form = document.querySelector('form[name="form-search"]');
  state.elements.urlInput = document.getElementById('url-input');
  state.elements.modal = document.getElementById('modal');
  state.elements.submitButton = document.getElementById('submit');
  updateFeeds(watchedState, updateInterval);
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const url = state.elements.urlInput.value;
    loadFeed(url, watchedState);
  });
};

export default () => {
  main();
};
