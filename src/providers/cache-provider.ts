import { ExtensionContext } from 'vscode';
import { EXTENSION_NAME } from '../constants';

export class CacheProvider {
  private readonly cacheName: string;
  private cache: Record<string, any>;

  static instance: CacheProvider;

  private constructor(
    private context: ExtensionContext,
    defaultState?: Record<string, any>
  ) {
    this.cacheName = EXTENSION_NAME;
    this.cache =
      this.context.globalState.get(this.cacheName, defaultState) ?? {};
  }

  static init(context: ExtensionContext, defaultState?: Record<string, any>) {
    this.instance = new CacheProvider(context, defaultState);
  }

  get(key: string) {
    return this.cache[key];
  }

  async set(key: string, value: any) {
    this.cache[key] = value;
    await this.context.globalState.update(this.cacheName, this.cache);
  }
}
