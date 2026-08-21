import { useLocation } from 'react-router'
import { ROUTES } from '@/app/routes'

/**
 * The project detail / volunteer / legal-aid pages are mounted under two
 * different prefixes: `/portal/...` (admin, inside `AppShell`) and
 * `/projects/...` (public, inside `PublicPortalShell`). This hook derives
 * which prefix is currently active from the URL so links built from these
 * shared page components stay within that prefix instead of hardcoding the
 * admin `/portal` path.
 */
export const usePortalLinks = () => {
  const { pathname } = useLocation()
  const isPublic = pathname.startsWith(ROUTES.projects)

  return {
    isPublic,
    browse: isPublic ? ROUTES.projects : ROUTES.portal,
    detail: (id: string) => (isPublic ? ROUTES.projectDetail(id) : ROUTES.portalDetail(id)),
    volunteer: (id: string) =>
      isPublic ? ROUTES.projectVolunteer(id) : ROUTES.portalVolunteer(id),
    legalAid: (id: string) =>
      isPublic ? ROUTES.projectLegalAid(id) : ROUTES.portalLegalAid(id),
  }
}
