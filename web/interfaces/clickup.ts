export interface Folder {
  id: string;
  name: string;
  orderindex: number;
  hidden: boolean;
  space: Space;
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
  status: Status;
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
  custom_fields: CustomField[];
  dependencies: Task[];
  linked_tasks: Task[];
  team_id: string;
  url: string;
  list?: List;
  folder?: Folder;
  space?: Space;
}

export interface User {
  id: 813;
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
  intervals: [
    {
      id: string;
      start?: number;
      end?: number;
      time: number;
      source: string;
      date_added: number;
    }
  ];
}

export interface WorkspaceFilters {
  assignees: User[];
  lists: List[];
}
