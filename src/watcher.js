import onChange from 'on-change';

export default (state) => {
    return onChange(state, (path, value) => {
        const { urlInput } = state.view;
        urlInput.focus();
        urlInput.classList.remove('border-3');
        urlInput.classList.remove('border-danger');
        switch (path) {
            case 'view.validateUrl': 
                if (!value) {
                    urlInput.classList.add('border-3');
                    urlInput.classList.add('border-danger');
                }
                break;
            case 'listOfUrl':
                urlInput.value = '';
                break;
            default:
        }
    });
}