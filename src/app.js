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
        try {
          const { parsingPosts } = parsingRSS(promise, watchedState);
          addOnlyNewPosts(parsingPosts, watchedState, feed);
        } catch {
          watchedState.form.status = 'parsingError';
          watchedState.form.information = 'error.parsingError';
        }
      })
      .catch(() => {
        watchedState.status = 'networkError';
        watchedState.view.information = 'error.networkError';
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
    watchedState.form.information = 'error.urlAlreadyExist';
  } else {
    watchedState.form.status = 'validationError';
    watchedState.form.information = 'error.validationError';
  }
};

const loadFeed = (url, watchedState) => {
  const schemaUrl = yup.string().required().url().trim()
    .notOneOf(watchedState.urlFeeds);
  schemaUrl.validate(url)
    .then(() => {
      watchedState.form.status = 'validation';
      const allOriginsURL = getAllOriginsURL(url);
      axios(allOriginsURL).then((response) => {
        const { parsingFeed, parsingPosts } = parsingRSS(response, watchedState);
        const newFeed = {
          url,
          id: _.uniqueId(),
          title: parsingFeed.title,
          description: parsingFeed.description,
        };
        watchedState.feeds.push(newFeed);
        watchedState.urlFeeds.push(url);
        addOnlyNewPosts(parsingPosts, watchedState, newFeed);
        watchedState.form.status = 'uploadedSuccessfully';
        watchedState.form.information = 'message.uploadedSuccessfully';
      })
        .catch((err) => {
          const nameErrorForState = err.message === 'Network Error' ? 'networkError' : err.message;
          watchedState.form.status = nameErrorForState;
          watchedState.form.information = `error.${nameErrorForState}`;
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
    form: {
      status: 'waitEnterURL',
      information: '',
    },
    viewedPosts: [],
  };
  initI18next(state);
  const watchedState = getWatcher(state);
  const form = document.querySelector('form[name="form-search"]');
  const posts = document.querySelector('.posts');
  const urlInput = document.getElementById('url-input');
  updateFeeds(watchedState, updateInterval);
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const url = urlInput.value;
    loadFeed(url, watchedState);
  });
  posts.addEventListener('click', (objEvent) => {
    const idPost = objEvent.target.getAttribute('data-post-id');
    const needAddIdPost = watchedState.viewedPosts.filter((elem) => elem === idPost).length === 0;
    if (needAddIdPost) {
      watchedState.viewedPosts.push(idPost);
    }
  });
};

export default () => {
  main();
};
