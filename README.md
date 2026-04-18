# Attendance Management System (Full Stack)

A role-based full-stack web application for managing student attendance with secure authentication, course management, and structured data handling.

---

## Overview

This system is designed to digitize attendance workflows in educational institutions. It supports multiple user roles with distinct permissions and functionalities, ensuring controlled access and organized data flow.

Roles supported:
- Students
- Teachers
- Administrators

Each role interacts with the system through dedicated workflows and interfaces.

---

## Tech Stack

### Frontend
- React (PWA-ready)
- HTML, CSS, JavaScript

### Backend
- Node.js
- Express.js (REST API architecture)

### Database
- MongoDB (schema design and relationships)

### Tools
- Git, GitHub
- Postman (API testing)

---

## Features

### Authentication and Authorization
- Secure login system
- Role-based access control (RBAC)
- Separate handling for students, teachers, and admins

### Teacher Functionality
- Mark attendance for assigned courses
- View student attendance records
- Manage course-specific data

### Student Functionality
- View personal attendance records
- Track subject-wise attendance

### Admin Functionality
- Create and manage users (students and teachers)
- Manage courses
- View attendance across the system

### Attendance Management
- Course-based attendance tracking
- Date-wise attendance records
- Structured data storage for scalability

---

## Key Skills Demonstrated

### Backend Development
- RESTful API design with modular structure
- Middleware-based request handling
- Authentication and authorization workflows

### Database Design
- Separate collections for users, students, and teachers
- Schema design for scalability and clarity
- Relationship handling between users, courses, and attendance

### System Design
- Role-based access control (RBAC)
- Separation of concerns (frontend, backend, database)
- Scalable architecture for future feature expansion

### Full Stack Integration
- API and frontend interaction
- State-driven UI updates
- End-to-end data flow management

---

## Architecture (High-Level)

Frontend (React)
        ↓
REST API Layer (Node.js + Express)
        ↓
Database (MongoDB)

- Client sends requests to backend APIs  
- Backend processes logic and interacts with database  
- Data is returned and rendered dynamically on the frontend  

---

## Installation and Setup

```bash
git clone https://github.com/TaiRaashid/attendance-system
cd attendance-system
npm install
npm run dev