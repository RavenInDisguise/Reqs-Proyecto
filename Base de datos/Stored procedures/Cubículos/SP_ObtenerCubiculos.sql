--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Devuelve todos los cubículos que no hayan sido eliminados
--              del sistema, con su información
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ObtenerCubiculos]
    @IN_soloNombre          BIT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @DESCRIPCION_ELIMINADO VARCHAR(32) = 'Eliminado';
    DECLARE @ID_ELIMINADO INT = NULL;

    BEGIN TRY

        -- Busca el ID del estado que corresponde a los eliminados
        SELECT  @ID_ELIMINADO = COALESCE(EC.[id], NULL)
        FROM    [dbo].[EstadosCubiculo] EC
        WHERE   EC.[descripcion] = @DESCRIPCION_ELIMINADO;

        -- Retorna los cubículos que no estén eliminados
        IF @IN_soloNombre = 1
        BEGIN
            SELECT  C.[id],
                    C.[nombre]
            FROM [dbo].[Cubiculos] C
            INNER JOIN [dbo].[EstadosCubiculo] EC
                ON  C.[idEstado] = EC.[id]
            WHERE EC.[id] != @ID_ELIMINADO;
        END
        ELSE
        BEGIN
            SELECT  C.[id],
                    C.[nombre],
                    EC.[descripcion] AS 'estado',
                    C.[capacidad],
                    C.[minutosMax] AS 'minutosMaximo',
                    SE.[descripcion] AS 'servicio'
            FROM [dbo].[Cubiculos] C
            INNER JOIN [dbo].[EstadosCubiculo] EC
                ON  C.[idEstado] = EC.[id]
            LEFT JOIN [dbo].[ServiciosDeCubiculo] SC
                ON  C.[id] = SC.[idCubiculo]
                AND SC.[activo] = 1 
            INNER JOIN [dbo].[ServiciosEspeciales] SE
                ON  SC.[idServiciosEspeciales] = SE.[id]
            WHERE EC.[id] != @ID_ELIMINADO;
        END;

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