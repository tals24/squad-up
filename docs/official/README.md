# Official Documentation

**Version:** 3.0  
**Last Updated:** January 2026  
**Status:** Complete Reference Suite (Frontend + Backend)

---

## 📚 Documentation Suite

This folder contains the **official reference documentation** for the Squad Up system (both frontend and backend). All documents are version-controlled, cross-referenced, and maintained alongside the codebase.

---

## 📖 Available Documents

## 🎨 Frontend Documentation

### 1. **Frontend Summary** (`frontendSummary.md`)
**50+ pages** | **11 features documented** | **2,000+ lines**

Complete frontend architecture documentation covering:
- 🏗️ Architecture overview (Feature-Sliced Design)
- 🎯 Application layer (Providers, Routing, Layout)
- 📄 Pages layer (Thin routing wrappers)
- ⚡ Features layer (11 independent business domains)
- 🎨 Shared layer (UI components, API, hooks, utilities)
- 📐 Component decomposition methodology
- 🔄 Critical workflows (game management, autosave, training)
- 📊 Refactoring achievements (5-phase summary)
- 🧪 Testing strategy and metrics

**Use for:**
- Understanding frontend architecture
- Finding components and hooks
- Learning refactoring patterns
- Onboarding frontend developers

---

### 2. **Design System** (`../DESIGN_SYSTEM.md`)
**40+ pages** | **60+ components** | **1,100+ lines**

Visual design and component library documentation covering:
- 🎨 Color system (semantic + 6 brand palettes)
- ✍️ Typography (scale, weights, usage)
- 📏 Spacing & layout (tokens, patterns)
- 🧩 Components (Button, Input, Dialog, Card, Badge, etc.)
- ♿ Accessibility (WCAG 2.1 AA compliance)
- 📱 Responsive design (mobile-first approach)
- 🎭 Dark mode implementation
- 📚 Usage guidelines and patterns

**Use for:**
- Building consistent UI
- Choosing correct components
- Understanding color tokens
- Ensuring accessibility
- Design/dev collaboration

---

## 💻 Backend Documentation

### 3. **Backend Summary** (`backendSummary.md`)
**50+ pages** | **370+ functions documented**

Complete backend architecture documentation covering:
- 🏗️ Architecture overview (MVC + Domain-Driven Design)
- 🎮 Controllers (21 files) - HTTP request handlers
- 🔧 Services (28 files) - Business logic layer
- 🛣️ Routes (21 files) - API endpoints
- 📊 Models (17 schemas) - Database layer
- 🔐 Middleware - Authentication & authorization
- 🧰 Utilities - Helper functions
- 📈 Statistics - Refactoring impact metrics

**Use for:**
- Understanding code organization
- Finding specific functionality
- Onboarding new developers
- Code reviews and architecture discussions

---

### 4. **API Documentation** (`apiDocumentation.md`)
**150+ endpoints** | **Complete API reference**

Comprehensive API endpoint documentation covering:
- 🔐 Authentication (login, register, token verification)
- 👥 User Management (CRUD operations)
- ⚽ Team Management (teams, players, rosters)
- 🏆 Game Management (games, events, reports)
- 📊 Analytics (partnerships, player stats, team discipline)
- 🎯 Training (sessions, drills)
- ⚙️ Configuration (organization settings)
- 📈 Data Aggregation (bulk data endpoints)

**Use for:**
- Frontend development (knowing which endpoints to call)
- API testing (request/response formats)
- Integration (third-party systems)
- Understanding available functionality

---

### 5. **Database Architecture** (`databaseArchitecture.md`)
**18 collections** | **Complete schema reference**

Database structure and architecture documentation covering:
- 📊 Collection details (18 collections across 6 domains)
- 🔗 Relationships (foreign keys, references)
- 📈 Indexes (performance optimization)
- 📏 Growth projections (scaling considerations)
- 🎯 Query patterns (common use cases)
- 🔧 Optimization strategies (performance tips)
- 📋 Best practices (dos and don'ts)

**Use for:**
- Understanding data model
- Writing efficient queries
- Planning new features
- Database optimization
- Scaling decisions

---

## 🔗 Document Cross-References

All three documents are **cross-referenced** for easy navigation:

```
API Request
    ↓
Backend Route (apiDocumentation.md)
    ↓
Controller → Service → Model (backendSummary.md)
    ↓
Database Collection (databaseArchitecture.md)
```

**Example:** Looking up how goals work?
1. **API:** `POST /api/games/:gameId/goals` endpoint format
2. **Backend:** `goalController.createGoal()` → `goalService.createGoal()` logic
3. **Database:** `goals` collection schema and indexes

---

## 📋 Quick Reference Table

| Document | Size | Focus | Primary Audience |
|----------|------|-------|------------------|
| **Frontend Summary** | 50+ pages | Frontend architecture | Frontend developers |
| **Design System** | 40+ pages | Visual design & components | Designers, frontend devs |
| **Backend Summary** | 50+ pages | Backend code organization | Backend developers |
| **API Documentation** | 45+ pages | HTTP endpoints | Frontend, integrators |
| **Database Architecture** | 30+ pages | Data model | Database admins, architects |

---

## 🎯 Common Use Cases

### "I need to add a new frontend feature"
1. Check **Frontend Summary** - Where should the feature live?
2. Check **Design System** - What components can I use?
3. Check **API Documentation** - What endpoints are available?

### "I need to add a new backend feature"
1. Check **Database Architecture** - Does the schema support it?
2. Check **Backend Summary** - Which service should contain the logic?
3. Check **API Documentation** - What endpoints exist or are needed?

### "I'm debugging a UI issue"
1. Check **Frontend Summary** - Which component/hook is responsible?
2. Check **Design System** - Is the component being used correctly?
3. Check browser DevTools - React components and state

### "I'm debugging a backend issue"
1. Check **API Documentation** - What's the expected request/response?
2. Check **Backend Summary** - Which controller/service handles it?
3. Check **Database Architecture** - What's the data structure?

### "I'm onboarding to the project"
1. Read **Frontend Summary** + **Backend Summary** - Understand architecture
2. Review **Design System** - Learn the UI components
3. Read **Database Architecture** - Understand the data model
4. Browse **API Documentation** - See what the system can do

### "I'm building a new UI component"
1. Check **Design System** - Does a similar component exist?
2. Check **Frontend Summary** - Where should it go (shared vs feature)?
3. Follow established patterns from existing components

---

## 📊 Documentation Statistics

### Coverage
- **Frontend Files:** 316+ files documented
- **Frontend Features:** 11 independent features
- **UI Components:** 60+ shared components
- **Backend Files:** 60+ files documented
- **API Endpoints:** 150+ endpoints documented
- **Database Collections:** 18 collections documented
- **Functions:** 370+ backend functions explained
- **Total Pages:** ~215 pages of documentation

### Quality
- ✅ Complete frontend architecture (FSD)
- ✅ Complete design system with 60+ components
- ✅ Every backend file has a purpose statement
- ✅ Every function has an explanation
- ✅ Every endpoint has request/response examples
- ✅ Every collection has schema details
- ✅ Component decomposition methodology documented
- ✅ Cross-referenced for easy navigation

---

## 🔄 Version History

### Version 3.0 (January 2026) - Current
- ✨ Added complete frontend architecture documentation (frontendSummary.md)
- ✨ Added comprehensive design system documentation (DESIGN_SYSTEM.md)
- 📊 Documented 5-phase frontend refactor
- 🎨 60+ UI components documented
- 📐 Component decomposition methodology
- Updated README with frontend docs
- Expanded use cases for frontend development

### Version 2.0 (December 2025)
- Added complete backend summary documentation
- Updated API docs with MVC architecture reference
- Updated database docs with refactoring notes
- Cross-referenced all documents
- Moved to docs/official/ for clarity

### Version 1.1 (December 2024)
- Added organization config documentation
- Added job queue system documentation
- Enhanced match event tracking

### Version 1.0 (Initial)
- Original API documentation
- Original database architecture

---

## 📝 Maintenance

### When to Update
- ✅ **Frontend Summary:** When adding/modifying features, components, or frontend architecture
- ✅ **Design System:** When adding/modifying UI components, colors, or design patterns
- ✅ **Backend Summary:** When adding/modifying files, functions, or architecture
- ✅ **API Documentation:** When adding/modifying endpoints or request/response formats
- ✅ **Database Architecture:** When adding/modifying collections, fields, or indexes

### How to Update
1. Make changes to the appropriate document
2. Update the "Last Updated" date
3. Add entry to "Recent Updates" section
4. Commit with descriptive message
5. Update cross-references if needed

---

## 🌟 Best Practices

### For Documentation Writers
1. **Be specific** - Include file paths, function names, exact endpoints
2. **Be concise** - 1-2 sentences per function, 2-3 per file purpose
3. **Be consistent** - Follow the existing format and style
4. **Cross-reference** - Link to related documents when relevant
5. **Update dates** - Always update "Last Updated" when making changes

### For Documentation Readers
1. **Start broad** - Read overviews before diving into details
2. **Use search** - Ctrl+F is your friend in these large documents
3. **Follow links** - Use cross-references to understand full context
4. **Bookmark** - Keep these docs handy while developing

---

## 📧 Contact

For questions about documentation or to report issues:
- Check the document's "Related Documentation" section for links
- Review the code directly in the relevant `backend/src/` folders
- Consult the inline code comments for implementation details

---

**This is a living documentation suite.** Keep it updated as the codebase evolves! 🚀

---

*Last Updated: January 2026*  
*Documentation Suite Version: 3.0*

