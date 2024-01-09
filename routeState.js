let routeState = new Map();


module.exports = {

    getOpenRoutes: () => {

        let openRoutes = []

        for (let [route, status] of routeState) {
            if (status.state === 'open') openRoutes.push(route)
        }

        return openRoutes
    },
    getClosedRoutes: () => {

        let closedRoutes = []

        for (let [route, status] of routeState) {
            if (status.state === 'closed') closedRoutes.push(route)
        }

        return closedRoutes
    },
    setRouteOpen: (route) => {
        if (routeState.has(route)) {
            let status = routeState.get(route)
            status.state = 'open'
            routeState.set(route, status)
        }
    },
    setRouteClosed: (route) => {
        if (routeState.has(route)) {
            let status = routeState.get(route)
            status.state = 'closed'
            routeState.set(route, status)
        }
    },
    setRoute: (route, newStatus) => {
        routeState.set(route, newStatus)
    },
    getRoute: (route) => {
        if (routeState.has(route)) {
            return routeState.get(route)
        }
    }
}