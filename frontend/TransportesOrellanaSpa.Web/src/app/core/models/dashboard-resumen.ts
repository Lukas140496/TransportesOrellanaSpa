export interface DashboardResumen {
    camiones: number;
    conductores: number;
    remolques: number;
    clientes: number;

    viajesMes: number;
    produccionMes: number;
    gananciaNetaMes: number;
    totalGastosMes: number;
    litrosCombustibleMes: number;
    costoCombustibleMes: number;
    kilometrosMes: number;

    gastosCamionesMes: number;
    gastosRemolquesMes: number;
    gastosConductoresMes: number;

    // ===================================
    // DOCUMENTACIÓN DE LA FLOTA
    // ===================================

    camionesRevisionVencida: number;
    camionesPermisoVencido: number;
    camionesSeguroVencido: number;
    camionesDocumentacionVencida: number;
}