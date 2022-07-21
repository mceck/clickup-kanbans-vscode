export function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export default class ClickupService {
  private sendMessage(obj: any) {
    return new Promise((res, err) => {
      const nonce = getNonce();
      const fn = ({ data }) => {
        if (data.nonce === nonce) {
          clearTimeout(stop);
          window.removeEventListener('message', fn);
          res(data);
        }
      };
      const stop = setTimeout(() => {
        window.removeEventListener('message', fn);
        err('timeout');
      }, 10000);
      const message = { ...obj, nonce };
      console.log('aio', message);
      window.addEventListener('message', fn);
      webVscode.postMessage(message);
    });
  }
  getUser() {
    return this.sendMessage({ type: 'getUser' });
  }
}
