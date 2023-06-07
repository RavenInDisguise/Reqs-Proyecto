--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-06-06
-- Descripción: Procedimiento que desactiva todas las reservas que no se
--              hayan confirmado antes de su hora de inicio
--              Devuelve una fila con tres datos:
--                  1. Hora de la verificación
--                  2. Número de reservas canceladas
--                  3. Hora de la próxima reserva en el sistema
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_DesactivarReservas]
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- VARIABLES
    DECLARE @reservas_canceladas INT = 0;
    DECLARE @hora_actual DATETIME = GETUTCDATE();
    DECLARE @siguiente_revision DATETIME = NULL;

    BEGIN TRY

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

            UPDATE Reservas
            SET [activo] = 0
            WHERE [activo] = 1
                AND [confirmado] = 0
                AND [horaInicio] < @hora_actual;

            -- Se obtiene el número de reservas que se cancelaron
            SET @reservas_canceladas = @@ROWCOUNT;

            -- Se obtiene la hora en la que debe hacerse la próxima revisión
            SELECT @siguiente_revision = COALESCE(MIN([horaInicio]), NULL)
            FROM Reservas
            WHERE [activo] = 1
                AND [confirmado] = 0
                AND [horaInicio] > GETUTCDATE();

            SELECT  @hora_actual AS 'horaActual',
                    @reservas_canceladas AS 'cancelaciones',
                    @siguiente_revision AS 'siguienteHora';
            
        -- COMMIT DE LA TRANSACCIÓN
        IF @transaccion_iniciada = 1
        BEGIN
            COMMIT TRANSACTION;
        END;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @transaccion_iniciada = 1
        BEGIN
            ROLLBACK;
        END;

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