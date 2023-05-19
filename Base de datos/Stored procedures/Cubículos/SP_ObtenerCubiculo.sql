--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Devuelve un cubículo si no ha sido eliminado del sistema,
--              con su información
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ObtenerCubiculo]
    @IN_idCubiculo          INT
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

        -- Validaciones

        -- Busca el ID del estado que corresponde a los eliminados
        SELECT  @ID_ELIMINADO = COALESCE(EC.[id], NULL)
        FROM    [dbo].[EstadosCubiculo] EC
        WHERE   EC.[descripcion] = @DESCRIPCION_ELIMINADO;

        -- Retorna el cubículo si existe
        IF EXISTS ( SELECT  1
                    FROM    [dbo].[Cubiculos] C
                    INNER JOIN  [dbo].[EstadosCubiculo] EC
                        ON  C.[idEstado] = EC.[id]
                    WHERE   C.[id] = @IN_idCubiculo
                        AND EC.[id] != @ID_ELIMINADO )
        BEGIN
            -- Si existe, retorna la información
            SELECT  C.[id],
                    C.[nombre], 
                    EC.[descripcion] AS 'estado', 
                    C.[capacidad], 
                    SE.[descripcion] AS 'servicio',
                    CASE
                        WHEN EXISTS(
                            SELECT  SdC.[id]
                            FROM    [dbo].[ServiciosDeCubiculo] SdC
                            WHERE   SdC.[idCubiculo] = C.[id]
                                AND SdC.[idServiciosEspeciales] = SE.[id]
                                AND SdC.[activo] = 1
                        )   THEN 1
                            ELSE 0
                    END AS 'activo',
                    (
                        SELECT  COUNT(R.[id])
                        FROM    [dbo].[Reservas] R
                        WHERE   R.[idCubiculo] = C.[id]
                            AND R.[horaInicio] > GETUTCDATE()
                            AND R.[activo] = 1
                    ) AS 'reservas',
                    C.[minutosMax] AS 'minutosMaximo'
            FROM [dbo].[Cubiculos] C
            CROSS JOIN [dbo].[ServiciosEspeciales] SE
            INNER JOIN [dbo].[EstadosCubiculo] EC
                ON C.[idEstado] = EC.[id]
            WHERE C.[id] = @IN_idCubiculo
                AND EC.[id] != @ID_ELIMINADO;
        END
        ELSE
        BEGIN
            RAISERROR('No existe ningún cubículo con el ID %d', 16, 1, @IN_idCubiculo);
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