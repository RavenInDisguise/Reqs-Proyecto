--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Devuelve todos los cubículos que estén disponibles
--              del sistema, con su información, según el rango
--              indicado en los parámetros
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ObtenerCubiculosDisponibles]
    @IN_horaInicio          DATETIME,
    @IN_horaFin             DATETIME
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @DESCRIPCION_DISPONIBLE VARCHAR(32) = 'Habilitado';
    DECLARE @ID_DISPONIBLE INT = NULL;

    BEGIN TRY

        -- Busca el ID del estado que corresponde a los disponibles
        SELECT  @ID_DISPONIBLE = COALESCE(EC.[id], NULL)
        FROM    [dbo].[EstadosCubiculo] EC
        WHERE   EC.[descripcion] = @DESCRIPCION_DISPONIBLE;

        -- Validaciones
        IF @IN_horaInicio >= @IN_horaFin
        BEGIN
            RAISERROR('La hora de inicio no puede ser mayor o igual que la hora de fin', 16, 1);
        END;

        -- Retorna los cubículos que estén disponibles
        SELECT  C.[id],
                C.[nombre],
                EC.[descripcion] AS 'estado',
                C.[capacidad],
                C.[minutosMax] AS 'minutosMaximo',
                SE.[descripcion] AS 'servicio'
        FROM    [dbo].[Cubiculos] AS C
        INNER JOIN  [dbo].[EstadosCubiculo] EC
            ON  EC.[id] = C.[idEstado]
        LEFT JOIN [dbo].[ServiciosDeCubiculo] SC
            ON  C.[id] = SC.[idCubiculo]
            AND SC.[activo] = 1 
        LEFT JOIN [dbo].[ServiciosEspeciales] SE
            ON SC.[idServiciosEspeciales] = SE.[id]
        WHERE   EC.[id] = @ID_DISPONIBLE
            AND [dbo].[BiblioTEC_FUNC_Choques](@IN_horaInicio, @IN_horaFin, NULL, C.[id], NULL) = 0;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;