/* eslint-disable @typescript-eslint/naming-convention */
import { BASE_API } from '../constants';
import * as vscode from 'vscode';
import fetch from 'node-fetch';

export default class BaseService {
  private get config() {
    return vscode.workspace.getConfiguration('clickup-kanban.auth');
  }
  protected get teamId(): string {
    return this.config.get('teamId')!;
  }

  protected get token(): string {
    return this.config.get('token')!;
  }

  private async doFetch(relativeUrl: string, options?: any): Promise<any> {
    const res = await fetch(BASE_API + relativeUrl, {
      headers: {
        Authorization: this.token,
        'Content-type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('unauthorized');
      }
      throw new Error(await res.text());
    }
    return await res.json();
  }

  protected doGet(relativeUrl: string, options?: any): Promise<any> {
    return this.doFetch(relativeUrl, {
      method: 'GET',
      ...options,
    });
  }

  protected doPost(
    relativeUrl: string,
    bodyObj?: any,
    options?: any
  ): Promise<any> {
    return this.doFetch(relativeUrl, {
      method: 'POST',
      body: bodyObj && JSON.stringify(bodyObj),
      ...options,
    });
  }

  protected doPut(
    relativeUrl: string,
    bodyObj?: any,
    options?: any
  ): Promise<any> {
    return this.doFetch(relativeUrl, {
      method: 'PUT',
      body: bodyObj && JSON.stringify(bodyObj),
      ...options,
    });
  }

  protected doDelete(relativeUrl: string, options?: any): Promise<any> {
    return this.doFetch(relativeUrl, {
      method: 'DELETE',
      ...options,
    });
  }

  protected toQueryString(query: any): string {
    if (!query) {
      return '';
    }
    return Object.entries(query)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const k = key + '[]';
          return value
            .filter((v) => v !== null && v !== undefined)
            .map(
              (v) =>
                `${encodeURIComponent(k)}=${encodeURIComponent(v.toString())}`
            )
            .join('&');
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(
          (value as any).toString()
        )}`;
      })
      .join('&');
  }
}
