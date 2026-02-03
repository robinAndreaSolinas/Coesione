import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Totale',
      component: () => import('../views/Dashboard/Totale.vue'),
      meta: { title: 'Totale' },
    },
    {
      path: '/social',
      name: 'Social',
      component: () => import('../views/Dashboard/Social.vue'),
      meta: { title: 'Analitiche Social' },
    },
    {
      path: '/video',
      name: 'Video',
      component: () => import('../views/Dashboard/Video.vue'),
      meta: { title: 'Analitiche Video' },
    },
    {
      path: '/newsletter',
      name: 'Newsletter',
      component: () => import('../views/Dashboard/Newsletter.vue'),
      meta: { title: 'Analitiche Newsletter' },
    },
    {
      path: '/siti',
      name: 'Siti',
      component: () => import('../views/Dashboard/Siti.vue'),
      meta: { title: 'Analitiche Siti' },
    },
    {
      path: '/sondaggi',
      name: 'Sondaggi',
      component: () => import('../views/Dashboard/Sondaggi.vue'),
      meta: { title: 'Analitiche Sondaggi' },
    },
    {
      path: '/admin/goals',
      name: 'GoalsAdmin',
      component: () => import('../views/Admin/GoalsAdmin.vue'),
      meta: { title: 'Gestione Obiettivi' },
    },
    {
      path: '/admin/users',
      name: 'UsersAdmin',
      component: () => import('../views/Admin/UsersAdmin.vue'),
      meta: { title: 'Gestione utenti' },
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: {
        title: 'Calendar',
      },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: {
        title: 'Profile',
      },
    },
    {
      path: '/form-elements',
      name: 'Form Elements',
      component: () => import('../views/Forms/FormElements.vue'),
      meta: {
        title: 'Form Elements',
      },
    },
    {
      path: '/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/Tables/BasicTables.vue'),
      meta: {
        title: 'Basic Tables',
      },
    },
    {
      path: '/line-chart',
      name: 'Line Chart',
      component: () => import('../views/Chart/LineChart/LineChart.vue'),
    },
    {
      path: '/bar-chart',
      name: 'Bar Chart',
      component: () => import('../views/Chart/BarChart/BarChart.vue'),
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: () => import('../views/UiElements/Alerts.vue'),
      meta: {
        title: 'Alerts',
      },
    },
    {
      path: '/avatars',
      name: 'Avatars',
      component: () => import('../views/UiElements/Avatars.vue'),
      meta: {
        title: 'Avatars',
      },
    },
    {
      path: '/badge',
      name: 'Badge',
      component: () => import('../views/UiElements/Badges.vue'),
      meta: {
        title: 'Badge',
      },
    },

    {
      path: '/buttons',
      name: 'Buttons',
      component: () => import('../views/UiElements/Buttons.vue'),
      meta: {
        title: 'Buttons',
      },
    },

    {
      path: '/images',
      name: 'Images',
      component: () => import('../views/UiElements/Images.vue'),
      meta: {
        title: 'Images',
      },
    },
    {
      path: '/videos',
      name: 'Videos',
      component: () => import('../views/UiElements/Videos.vue'),
      meta: {
        title: 'Videos',
      },
    },
    {
      path: '/blank',
      name: 'Blank',
      component: () => import('../views/Pages/BlankPage.vue'),
      meta: {
        title: 'Blank',
      },
    },

    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: {
        title: '404 Error',
      },
    },

    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Signin',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Signup',
      },
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'Dashboard'} | Cohesion Analytics`
  next()
})
