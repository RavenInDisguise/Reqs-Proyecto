--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-19
-- Descripción: Procedimiento que retorna los datos de una reserva
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ObtenerReserva]
    @IN_idReserva           INT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    BEGIN TRY

        -- VALIDACIONES
        -- ¿Existe la reserva?
        IF EXISTS (
            SELECT  1
            FROM    [dbo].[Reservas] R
            WHERE   R.[id] = @IN_idReserva
                AND R.[eliminada] = 0
        )
        BEGIN
            SELECT  R.[id],
                    C.[nombre] AS 'nombreCubiculo', 
                    C.[id] AS 'idCubiculo', 
                    R.[fecha] AS 'fecha',
                    R.[horaInicio] AS 'horaInicio',
                    R.[horaFin] AS 'horaFin',
                    R.[activo] AS 'activo',
                    R.[confirmado] AS 'confirmado',
                    CONCAT(E.[nombre], ' ', E.[apellido1], ' ', E.[apellido2]) AS 'nombreEstudiante',
                    E.[id] AS 'idEstudiante'
            FROM    [dbo].[Reservas] R 
            LEFT JOIN [dbo].[Cubiculos] C 
                ON  R.[idCubiculo] = C.[id]
            INNER JOIN [dbo].[Estudiantes] E
                ON E.[id] = R.[idEstudiante]
            WHERE R.[id] = @IN_idReserva;
        END
        ELSE
        BEGIN
            RAISERROR('No existe ninguna reserva con el ID %d', 16, 1, @IN_idReserva);
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