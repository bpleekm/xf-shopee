# OpenCode Agent Instructions

## Repository Type
- This is a **design document repository** for a department store ERP system.
- No source code, build scripts, tests, or linting configurations exist.
- All content is documentation in Markdown files.

## Structure
- `PROJECT.md`: High-level overview (Chinese) with architecture and workspace specification.
- `docs/modules/`: Detailed specifications for each subsystem.
- `docs/modules/README.md`: Module dependencies, role matrix, and suggested tech stack.

## Workspace Specification
- All project files should be placed directly under the repository root directory.
- Follow the flat directory structure defined in `PROJECT.md`'s "工作空间规范" section.
- If adding implementation code, create directories like `backend/`, `frontend/`, `mobile/` at root level.
- Documentation should remain in `docs/` directory (design documents are in `docs/modules/`).

## Language
- Primary documentation language is **Chinese**.
- Some technical terms and code snippets may be in English.
- Keep language consistent with existing files.

## Editing Guidelines
- Update markdown files in `docs/modules/` for subsystem changes.
- Follow the existing section structure within each module file.
- Preserve the dependency diagram in `docs/modules/README.md` if adding/removing modules.
- No need to run any validation commands; there are none.

## References
- Review `docs/modules/README.md` for the overall architecture and role permissions.
- The eight modules correspond to business domains (user management, SKU, cart, order, permission, web admin, web frontend, mobile app).
