/* eslint-disable @typescript-eslint/naming-convention */
export interface Folder {
  id: string;
  name: string;
  orderindex: number;
  hidden: boolean;
  space: Space;
  statuses?: Status[];
  task_count: string;
  lists?: List[];
}

export interface Status {
  status: string;
  color: string;
  orderindex?: number;
  hide_label: boolean;
}

export interface List {
  id: string;
  name: string;
  orderindex: number;
  content: string;
  statuses?: Status[];
  task_count?: number;
  due_date?: number;
  start_date?: number;
  folder?: Folder;
  space: Space;
  archived?: boolean;
}

export interface Space {
  id: string;
  name: string;
  color?: string;
  folders?: Folder[];
  lists?: List[];
  statuses: Status[];
}

export interface Tag {
  name: string;
  tag_fg: string;
  tag_bg: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: string;
  type_config?: any;
  required?: boolean;
}

export interface Task {
  id: string;
  custom_id?: string;
  name: string;
  text_content: string;
  description: string;
  status: Status;
  orderindex: number;
  date_created: number;
  date_updated: number;
  date_closed: number;
  creator: User;
  assignees: User[];
  watchers: User[];
  tags: Tag[];
  parent: string;
  priority: number;
  due_date: number;
  start_date: number;
  points: number;
  time_estimate: number;
  time_spent: number;
  custom_fields: CustomField[];
  dependencies: Task[];
  linked_tasks: Task[];
  team_id: string;
  url: string;
  list?: List;
  folder?: Folder;
  space?: Space;
  override_statuses?: boolean;
  statuses: Status[];
}

export interface Comment {
  id: string;
  comment: CommentDetail[];
  comment_text: string;
  user: User;
  resolved: boolean;
  assignee: User;
  assigned_by: User;
  reactions: any[];
  date: number;
}

export interface CommentDetail {
  text: string;
  type?: 'tag' | 'frame' | 'attachment' | 'task_mention';
  frame?: {
    id: string;
    url: string;
    src: string;
    service: string;
  };
  attachment?: {
    id: string;
    url: string;
    url_w_query?: string;
    size?: number;
    extension?: string;
    mimetype?: string;
    thumbnail_small?: string;
    thumbnail_large?: string;
    thumbnail_medium?: string;
    user: User;
  };
  attributes?: {
    link?: string;
  };
  task_mention?: { task_id: string };
}

export interface User {
  id: number;
  username: string;
  email: string;
  color?: string;
  initials: string;
  profilePicture?: string;
  role: number;
}

export interface TimeTrack {
  user: User;
  time: number;
  intervals: [];
}

export interface Interval {
  id: string;
  start: number;
  end?: number;
  duration: number;
  source?: string;
  date_added?: number;
  user: User;
  task: Task;
}

export interface WorkspaceConfig {
  filters: PageFilters[];
}

export interface PageFilters {
  name: string;
  default: boolean;
  selectedLists: List[];
  selectedAssignees: User[];
  selectedView: View;
  tags: string[];
  statuses: string[];
  due_date_gt?: number;
  due_date_lt?: number;
  subtasks: boolean;
  include_closed: boolean;
  allTracking: boolean;
}

export interface View {
  id: string;
  name: string;
  type: string;
  list?: List;
}

export interface InputOptions {
  placeHolder: string;
  prompt: string;
  value: string;
}
