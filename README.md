# TimeTrack

Manage your work, tasks, and projects effortlessly with TimeTrack for your
entire team. Log hours, prioritize to-do's, add notes & projects, and stay
organized in one place.

Built for [EBERT-Automation](https://ebert-automation.de/)

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)

## Screenshots

<div>
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/Home.png" width="300">
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/History.png" width="300">
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/Profile.png" width="300">
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/Projects.png" width="300">
</div>

## Tech Stack

**Framework:**

[![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)

**Authentication:** [Lucia](https://lucia-auth.com/)

**Database:** [Prisma](https://www.prisma.io/)

**UI:**

- [NextIntl](https://next-intl-docs.vercel.app/) - _Translations_
- [TailwindCSS](https://tailwindcss.com/) - _Styling_
- [ShadcnUI](https://ui.shadcn.com/) - _UI Components_
- [animate.css](https://animate.style/) - _UI Animations_
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) - _Icons_

## Deployment

TimeTrack is designed to work seamlessly with Docker and requires a MySQL database for data storage.

**Get the Docker Image:**

```bash
docker pull someoverflow/timetrack
```

<details>
<summary><i>Build Your Own Docker Image</i></summary>
<br>
<pre>
docker buildx create --name somebuilder
docker buildx use somebuilder
docker buildx inspect --bootstrap
docker buildx build --platform linux/amd64,linux/arm64 -t someoverflow/timetrack:dev .
</pre>
</details>
<br>

**Run the Docker Image**

```bash
docker run --name timetrack -p 3000:3000 \
--env=DATABASE_HOST=<DatabaseHost> \
--env=DATABASE_USER=<DatabaseUser> \
--env=DATABASE_PASSWORD=<DatabasePassword> \
--env=DATABASE_DB=<Database> \
-d someoverflow/timetrack:latest
```

## Environment Variables

| Variable                  | Description                                                   | Default         |
| ------------------------- | ------------------------------------------------------------- | --------------- |
| `URL`                     | Link to the instance (e.g., https://timetrack.example.com)    | _(empty)_       |
| `DATABASE_HOST`           | MySQL database hostname or IP                                 | `localhost`     |
| `DATABASE_PORT`           | MySQL database port                                           | `3306`          |
| `DATABASE_USER`           | MySQL database username                                       | `timetrack`     |
| `DATABASE_PASSWORD`       | MySQL database password                                       | `timetrack`     |
| `DATABASE_DB`             | MySQL database name                                           | `timetrack`     |
| `INSTANCE_NAME`           | Watermark shown at the bottom right corner if set             | _(empty)_       |
| `NEXT_PUBLIC_LOGIN_IMAGE` | URL for login screen image                                    | _(empty)_       |
| `NEXT_PUBLIC_COMPANY`     | Company name                                                  | _(empty)_       |
| `SMTP_HOST`               | SMTP server hostname                                          | _(empty)_       |
| `SMTP_PORT`               | SMTP server port                                              | _(empty)_       |
| `SMTP_USER`               | SMTP server username                                          | _(empty)_       |
| `SMTP_PASSWORD`           | SMTP server password                                          | _(empty)_       |
| `SMTP_SENDER`             | Mail sender address (e.g., TimeTrack <timetrack@example.com>) | _(empty)_       |
| `SMTP_SSL`                | Enable SSL for SMTP server                                    | `true`          |
| `TZ`                      | Time Zone                                                     | `Europe/Berlin` |
| `PORT`                    | Port on which the application listens                         | `3000`          |
| `HOSTNAME`                | Server bind hostname or IP address                            | `"0.0.0.0"`     |

**Note**: The following environment variables must be set for the application to run properly:

- `URL`: The link to the deployed instance (e.g., https://timetrack.example.com)
- `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_DB`: Database connection details
- `NEXT_PUBLIC_COMPANY`: The name of your company or organization

**Docker Volumes**
| Name | Path |
| ------ | -------- |
| Backup | /backups |

Backups are created daily at 3:00 AM as MySQL dumps and stored in the `/backups` volume.
