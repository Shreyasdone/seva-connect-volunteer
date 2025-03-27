create table public.chat_messages (
  id serial not null,
  event_id integer not null,
  volunteer_id uuid null,
  volunteer_non_auth_id integer null,
  volunteer_name text not null,
  volunteer_email text not null,
  message text not null,
  created_at timestamp with time zone null default now(),
  constraint chat_messages_pkey primary key (id),
  constraint fk_event foreign KEY (event_id) references events (id)
) TABLESPACE pg_default;

create table public.event_organizers (
  id uuid not null,
  email text not null,
  full_name text null,
  organization text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint event_organizers_pkey primary key (id),
  constraint event_organizers_email_key unique (email),
  constraint event_organizers_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

create trigger update_event_organizers_updated_at BEFORE
update on event_organizers for EACH row
execute FUNCTION update_updated_at_column ();

create table public.events (
  id serial not null,
  title text not null,
  location text not null,
  location_type text not null,
  description text null,
  thumbnail_image text null,
  event_category text not null,
  start_date timestamp without time zone not null,
  end_date timestamp without time zone not null,
  registration_deadline timestamp without time zone null,
  max_volunteers integer null default 25,
  status text not null default 'draft'::text,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  email_sent boolean null default false,
  constraint events_pkey primary key (id),
  constraint events_event_category_check check (
    (
      event_category = any (
        array[
          'A'::text,
          'B'::text,
          'C'::text,
          'D'::text,
          'E'::text
        ]
      )
    )
  ),
  constraint events_location_type_check check (
    (
      location_type = any (array['virtual'::text, 'physical'::text])
    )
  ),
  constraint events_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'published'::text,
          'archived'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.skills (
  skill_id serial not null,
  skill text not null,
  skill_icon text null,
  constraint skills_pkey primary key (skill_id),
  constraint skills_skill_key unique (skill)
) TABLESPACE pg_default;

create table public.task_skills (
  task_id integer not null,
  skill_id integer not null,
  constraint task_skills_pkey primary key (task_id, skill_id),
  constraint task_skills_skill_id_fkey foreign KEY (skill_id) references skills (skill_id) on delete CASCADE,
  constraint task_skills_task_id_fkey foreign KEY (task_id) references tasks (task_id) on delete CASCADE
) TABLESPACE pg_default;


create table public.tasks (
  task_id serial not null,
  event_id integer null,
  volunteer_id uuid null,
  volunteer_email text null,
  task_description text not null,
  task_status text not null default 'unassigned'::text,
  task_feedback text null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint tasks_pkey primary key (task_id),
  constraint tasks_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint tasks_volunteer_id_fkey foreign KEY (volunteer_id) references volunteers (id) on delete set null,
  constraint tasks_task_status_check check (
    (
      task_status = any (
        array[
          'unassigned'::text,
          'assigned'::text,
          'inprogress'::text,
          'complete'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger update_tasks_updated_at BEFORE
update on tasks for EACH row
execute FUNCTION update_tasks_updated_at_column ();


create table public.volunteer_event (
  id serial not null,
  volunteer_id uuid null,
  event_id integer null,
  status text not null default 'not invited'::text,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  feedback text null,
  feedback_submitted_at timestamp without time zone null,
  star_rating integer null,
  constraint volunteer_event_pkey primary key (id),
  constraint volunteer_event_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint volunteer_event_volunteer_id_fkey foreign KEY (volunteer_id) references volunteers (id) on delete CASCADE,
  constraint volunteer_event_star_rating_check check (
    (
      (star_rating >= 1)
      and (star_rating <= 5)
    )
  ),
  constraint volunteer_event_status_check check (
    (
      status = any (array['not registered'::text, 'registered'::text])
    )
  )
) TABLESPACE pg_default;


create table public.volunteer_skills (
  volunteer_id uuid not null,
  skill_id integer not null,
  constraint volunteer_skills_pkey primary key (volunteer_id, skill_id),
  constraint volunteer_skills_skill_id_fkey foreign KEY (skill_id) references skills (skill_id) on delete CASCADE,
  constraint volunteer_skills_volunteer_id_fkey foreign KEY (volunteer_id) references volunteers (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.volunteers (
  id uuid not null,
  email text null,
  full_name text null,
  mobile_number text null,
  age integer null,
  organization text null,
  work_types text[] null default '{}'::text[],
  preferred_location text null,
  availability_start_date timestamp with time zone null,
  availability_end_date timestamp with time zone null,
  time_preference text null,
  days_available text[] null default '{}'::text[],
  onboarding_step integer null default 1,
  onboarding_completed boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint volunteers_pkey primary key (id),
  constraint volunteers_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;
create trigger update_volunteers_updated_at BEFORE
update on volunteers for EACH row
execute FUNCTION update_updated_at_column ();
create table public.volunteers_non_auth (
  id uuid not null default gen_random_uuid(), -- Internal UUID
  volunteer_id uuid not null, -- FK linking to volunteers table
  email text null,
  full_name text null,
  mobile_number text null,
  age integer null,
  organization text null,
  work_types text[] null default '{}'::text[],
  preferred_location text null,
  availability_start_date timestamp with time zone null,
  availability_end_date timestamp with time zone null,
  time_preference text null,
  days_available text[] null default '{}'::text[],
  onboarding_step integer null default 1,
  onboarding_completed boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  constraint volunteers_non_auth_pkey primary key (id),
  constraint volunteers_non_auth_volunteer_id_fkey 
    foreign key (volunteer_id) references public.volunteers(id) on delete cascade
) TABLESPACE pg_default;
create or replace function copy_new_volunteers_to_non_auth() returns trigger as $$
begin
  insert into public.volunteers_non_auth (
    id, volunteer_id, email, full_name, mobile_number, age, organization, work_types,
    preferred_location, availability_start_date, availability_end_date,
    time_preference, days_available, onboarding_step, onboarding_completed,
    created_at, updated_at
  )
  values (
    gen_random_uuid(), -- Internal UUID for non-auth tracking
    NEW.id, -- Store actual volunteer_id as FK
    NEW.email, NEW.full_name, NEW.mobile_number, NEW.age, NEW.organization, NEW.work_types,
    NEW.preferred_location, NEW.availability_start_date, NEW.availability_end_date,
    NEW.time_preference, NEW.days_available, NEW.onboarding_step, NEW.onboarding_completed,
    NEW.created_at, NEW.updated_at
  );
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trigger_copy_volunteers_non_auth on public.volunteers;

create trigger trigger_copy_volunteers_non_auth
after insert on public.volunteers
for each row
execute function copy_new_volunteers_to_non_auth();

-- Create volunteer notifications table to track emails sent
create table public.volunteer_notifications (
  id serial not null,
  volunteer_email text not null,
  event_id integer not null,
  notification_type text not null,
  sent_at timestamp with time zone not null default now(),
  read_at timestamp with time zone null,
  opened_at timestamp with time zone null,
  clicked_at timestamp with time zone null,
  constraint volunteer_notifications_pkey primary key (id),
  constraint volunteer_notifications_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade,
  constraint volunteer_notifications_notification_type_check check (
    notification_type = any (array['new_event'::text, 'reminder'::text, 'update'::text, 'cancellation'::text, 'task_assigned'::text, 'task_created'::text])
  )
) TABLESPACE pg_default;

