
# TimeTrack

Manage your work, tasks, and projects effortlessly with TimeTrack for your
entire team. Log hours, prioritize to-do's, add notes & projects, and stay
organized in one place.


[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)

## Screenshots

<div>
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/Home.png" width="300">
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/History.png" width="300">
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/Profile.png" width="300">
  <img src="https://github.com/someoverflow/timetrack/blob/e5e8f48be97b05f35e1cb0b4a276b38b82ec6204/screenshots/Projects.png" width="300">
</div>


## Tech Stack

**Framework:** ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)

**Authentication:** [AuthJS](https://authjs.dev/)

**Database:** [Prisma](https://www.prisma.io/)

**UI:**
- [NextIntl](https://next-intl-docs.vercel.app/) - *Translations*
- [TailwindCSS](https://tailwindcss.com/) - *Styling*
- [ShadcnUI](https://ui.shadcn.com/) - *UI Components*
- [animate.css](https://animate.style/) - *UI Animations*
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) - *Icons*


## Deployment

Mainly built and maintained for Docker. However, the possibility of vercel is also there because of nextjs but has not been tested.

A MySQL database is required for data storage. Other databases are currently not supported.

**Build the Docker Image:**
```bash
git clone https://github.com/someoverflow/timetrack
cd timetrack
docker build -t some/timetrack:prod .
```

**Run the Docker Image**
```bash
docker run --name timetrack -p 8080:3000 \
--env=DATABASE_HOST=<DatabaseHost> \
--env=DATABASE_USER=<DatabaseUser> \
--env=DATABASE_PASSWORD=<DatabasePassword> \
--env=DATABASE_DB=<Database> \
-d some/timetrack:prod
```


## Environment Variables

| Variable            | Description                                          | Default      |
|---------------------|------------------------------------------------------|--------------|
| `PORT`              | The port number on which the application listens     | `3000`       |
| `HOSTNAME`          | The hostname or IP address the server binds to       | `"0.0.0.0"`  |
| `BACKUP`            | Enables MySQL dumps to a mountable Docker volume     | `false`      |
| `BACKUP_DELAY`      | Interval in seconds between backup executions        | `86400` (24h)|
| `DATABASE_HOST`     | Hostname or IP of the MySQL database                 | `localhost`  |
| `DATABASE_PORT`     | Port number of the MySQL database                    | `3306`       |
| `DATABASE_USER`     | Username for connecting to the MySQL database        | `timetrack`  |
| `DATABASE_PASSWORD` | Password for the MySQL database user                 | `timetrack`  |
| `DATABASE_DB`       | Name of the MySQL database                           | `timetrack`  |
| `AUTH_SECRET`       | Secret key for encrypting Auth.js JWT                | *Generated*  |
| `NEXT_PUBLIC_API_URL` | The primary API URL used by the application        | *(empty)*    |


**Docker Volumes**
| Name   | Path       |
| ------ | -----------|
| Backup | /backups   |

## API Reference (TODO)

#### Get all items

```http
  GET /api/items
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Required**. Your API key |

#### Get item

```http
  GET /api/items/${id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of item to fetch |

#### add(num1, num2)

Takes two numbers and returns the sum.

